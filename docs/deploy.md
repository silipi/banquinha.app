# Deploy

| Piece    | Where                                                    | How it ships                                                                          |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Web      | Vercel (root `apps/web`, functions in `gru1`)            | Vercel Git integration; `apps/web/vercel.json` skips builds when the web is unchanged |
| API      | Google Cloud Run, `southamerica-east1`                   | `deploy-api` job in `.github/workflows/ci.yml`                                        |
| Postgres | Neon, `aws-sa-east-1` (branches `production`, `preview`) | Migrations run in CI before each API deploy                                           |

## API pipeline (push to `main`)

1. `check` passes.
2. `pnpm db:migrate` against the production branch (direct connection string).
3. Docker image built from `apps/api/Dockerfile`, pushed to Artifact Registry (`banquinha/api:<sha>`).
4. `gcloud run deploy banquinha-api` with secrets from Secret Manager.

Migrations run before the new revision serves traffic, so every migration must work with the
previous API version too (add columns before using them, drop them a release later).

## GitHub configuration

Repository **variables** (Settings → Secrets and variables → Actions → Variables):

| Name               | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`   | GCP project ID                                                                     |
| `GCP_WIF_PROVIDER` | `projects/<number>/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_DEPLOYER_SA`  | `github-deployer@<project>.iam.gserviceaccount.com`                                |
| `WEB_ORIGIN`       | Public URL of the web app (CORS)                                                   |

Repository **secret**: `DATABASE_URL_DIRECT`, the Neon production direct (non-pooler) URL.

## One-time GCP setup

Run in Cloud Shell (console.cloud.google.com, `>_` button) after creating the project and
linking billing.

```bash
PROJECT_ID=banquinha-512513
REGION=southamerica-east1
GITHUB_REPO=silipi/banquinha.app
gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUNTIME_SA=banquinha-api@$PROJECT_ID.iam.gserviceaccount.com
DEPLOYER_SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com

# APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com

# Image registry
gcloud artifacts repositories create banquinha --repository-format=docker --location="$REGION"

# Service accounts: one the API runs as, one GitHub Actions deploys as
gcloud iam service-accounts create banquinha-api --display-name="banquinha API runtime"
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions deployer"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SA" --role=roles/run.admin
gcloud artifacts repositories add-iam-policy-binding banquinha --location="$REGION" \
  --member="serviceAccount:$DEPLOYER_SA" --role=roles/artifactregistry.writer
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:$DEPLOYER_SA" --role=roles/iam.serviceAccountUser

# Secret: internal key shared by web and API (database-url is created in the next block)
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create internal-api-key --data-file=-
gcloud secrets add-iam-policy-binding internal-api-key \
  --member="serviceAccount:$RUNTIME_SA" --role=roles/secretmanager.secretAccessor

# Workload Identity Federation: only this repo may act as the deployer
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github --location=global \
  --workload-identity-pool=github --display-name="GitHub" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GITHUB_REPO"

# Values for the GitHub variables
echo "GCP_PROJECT_ID=$PROJECT_ID"
echo "GCP_WIF_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
echo "GCP_DEPLOYER_SA=$DEPLOYER_SA"
```

The database URL goes in on its own, so it never lands in shell history. Run `read -rs DB_URL`
**alone** (pasted as part of a block, `read` swallows the next pasted line), paste the Neon
production **pooled** URL at the silent prompt and press Enter. Then:

```bash
printf '%s' "$DB_URL" | gcloud secrets create database-url --data-file=- && unset DB_URL
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:$RUNTIME_SA" --role=roles/secretmanager.secretAccessor
# Should print "postgresql://"
gcloud secrets versions access latest --secret=database-url | cut -c1-13
```

Right after a service account is created, IAM may still answer "does not exist". Wait a few
seconds and rerun that command.

The web app needs the same `INTERNAL_API_KEY`:
`gcloud secrets versions access latest --secret=internal-api-key`.

## Vercel environment variables

| Name                   | Value                                                                              | Environments        |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `NEXT_PUBLIC_API_URL`  | `https://banquinha-api-877698749664.southamerica-east1.run.app`                    | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, no trailing slash                                                 | Production, Preview |
| `INTERNAL_API_KEY`     | `gcloud secrets versions access latest --secret=internal-api-key` (mark Sensitive) | Production, Preview |

`NEXT_PUBLIC_*` values are inlined at build time: redeploy after changing them.
Function region: `gru1` (Settings → Functions).
