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

Once `minha.banquinha.app` points to Vercel, add `NEXT_PUBLIC_APP_URL=https://minha.banquinha.app`.
Until then the merchant area is at `/painel` on the site.

`NEXT_PUBLIC_*` values are inlined at build time: redeploy after changing them.

## Domains

`banquinha.app` is registered at Cloudflare, so its DNS lives there. `.app` is on the HSTS
preload list: every host must serve HTTPS, which Vercel and R2 handle.

| Host                    | Points to                                                       | Cloudflare record                                    |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| `banquinha.app`         | Vercel                                                          | Values Vercel shows when adding the domain, DNS only |
| `www.banquinha.app`     | Vercel (redirects)                                              | CNAME from Vercel, DNS only                          |
| `minha.banquinha.app`   | Vercel (same project)                                           | CNAME from Vercel, DNS only                          |
| `img.banquinha.app`     | R2 bucket                                                       | Created by R2 when connecting the custom domain      |
| `send.banquinha.app`    | Resend                                                          | MX/TXT records Resend shows when adding the domain   |
| `banquinha.app` (email) | Cloudflare Email Routing, forwarding `oi@` to the owner's inbox | MX/TXT created by Email Routing                      |

Vercel records stay **DNS only** (grey cloud): Vercel issues the certificates and runs its own
CDN, and proxying through Cloudflare breaks certificate renewal.

There is no `api.banquinha.app`. Browsers reach the API through `/api/*` on the web host (see
`next.config.ts`), and Cloud Run domain mappings are not available in `southamerica-east1`; a
custom API domain would need a global external load balancer (~US$18/month). The API keeps its
`run.app` URL in `NEXT_PUBLIC_API_URL`.

After the domains are live:

1. Vercel: `NEXT_PUBLIC_SITE_URL=https://banquinha.app` and
   `NEXT_PUBLIC_APP_URL=https://minha.banquinha.app` (Production), then redeploy.
2. GitHub variable `WEB_ORIGIN=https://banquinha.app`.
3. Images: move `R2_PUBLIC_URL` to `https://img.banquinha.app` in `ci.yml` and Vercel, then
   rewrite the stored URLs once:

   ```sql
   UPDATE stores SET logo_url = replace(logo_url, '<r2.dev origin>', 'https://img.banquinha.app'),
     banner_url = replace(banner_url, '<r2.dev origin>', 'https://img.banquinha.app');
   UPDATE product_images SET url = replace(url, '<r2.dev origin>', 'https://img.banquinha.app');
   ```

## Analytics and error tracking (PostHog)

PostHog runs on the platform's own pages (landing, blog, legal pages, merchant area),
never on storefronts (`apps/web/src/lib/analytics.ts`). It records page views, clicks,
session replays and browser errors; the web server (`src/instrumentation.ts`) and the API
(`ErrorReportingInterceptor`) report 5xx errors to the same project. Everything is off
while the key is unset.

| Name                       | Where                                                     |
| -------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | Vercel, Production only: the project API key (`phc_...`)  |
| `NEXT_PUBLIC_POSTHOG_HOST` | Vercel, Production only: `https://us.i.posthog.com` or EU |
| `POSTHOG_KEY`              | GitHub repository variable (passed to Cloud Run by CI)    |
| `POSTHOG_HOST`             | GitHub repository variable, same host as the web          |

The project key is public (it ships to browsers), so it is a variable, not a secret.

## Sign-in configuration (API)

Both are optional: without `GOOGLE_CLIENT_ID` the Google button is hidden, and without `RESEND_API_KEY` "forgot password" cannot send its email.

| Name               | Where                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID` | OAuth client (Web) in Google Cloud → Credentials; plain env var                                          |
| `RESEND_API_KEY`   | Resend, after verifying the sending domain; Secret Manager secret `resend-api-key` (already in `ci.yml`) |

Add them to the `gcloud run deploy` flags in `ci.yml` (`--set-env-vars` / `--set-secrets`) when they exist.

## Image uploads (Cloudflare R2)

Without R2 the API refuses uploads in production ("envio de imagens indisponível").

1. Cloudflare dashboard → R2 → create bucket `banquinha-images`, location **Automatic** (R2 has
   no South America region; a custom domain serves images from Cloudflare's São Paulo cache).
2. Bucket → Settings → Public access: connect a custom domain (e.g. `img.banquinha.app`) once the
   domain is on Cloudflare, or enable the `r2.dev` URL meanwhile (rate limited and uncached, fine
   for the beta). Stored image URLs are absolute, so moving from `r2.dev` to the custom domain
   later needs a one-off `UPDATE` replacing the prefix in `stores` and `product_images`.
3. R2 → Manage API tokens → create a token with **Object Read & Write** on that bucket only.

| Name                   | Where                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | API: plain env var (Cloudflare account id)                              |
| `R2_BUCKET`            | API: plain env var                                                      |
| `R2_PUBLIC_URL`        | API **and Vercel** (Production, Preview): public bucket URL, no `/` end |
| `R2_ACCESS_KEY_ID`     | API: Secret Manager secret `r2-access-key-id`                           |
| `R2_SECRET_ACCESS_KEY` | API: Secret Manager secret `r2-secret-access-key`                       |

Then add them to `gcloud run deploy` in `ci.yml` and grant `banquinha-api` the
`secretAccessor` role on both secrets, like `database-url`. The web app reads `R2_PUBLIC_URL` at
build time to allow those images in `next/image`, so redeploy it after setting the variable.
Use a separate bucket (or at least the same one with separate keys) for Preview if preview
uploads should not mix with production.
Function region: `gru1` (Settings → Functions).
