# Deploy

| Piece    | Where                                                    | How it ships                                                                          |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Web      | Vercel (root `apps/web`, functions in `gru1`)            | Vercel Git integration; `apps/web/vercel.json` skips builds when the web is unchanged |
| API      | Google Cloud Run, `southamerica-east1`                   | `deploy-api` job in `.github/workflows/ci.yml`                                        |
| Postgres | Neon, `aws-sa-east-1` (branches `production`, `staging`) | Migrations run in CI before each API deploy                                           |

## Environments and release flow

GitHub Flow: `main` is always what runs in production. Work happens on a branch cut from
`main`, opened as a pull request, and ships when the PR is squash-merged.

| Environment | Git                        | Web (Vercel)                                         | API (Cloud Run)         | Database          | Images (R2)                |
| ----------- | -------------------------- | ---------------------------------------------------- | ----------------------- | ----------------- | -------------------------- |
| Production  | `main`                     | `banquinha.app`, `minha.banquinha.app`               | `banquinha-api`         | Neon `production` | `banquinha-images`         |
| Staging     | any branch with an open PR | Preview URL per branch, behind Vercel Authentication | `banquinha-api-staging` | Neon `staging`    | `banquinha-images-staging` |

- Every PR push deploys its API to the single staging service and migrates the staging
  database. With two PRs open, the last push wins: the previews of the other PR talk to an
  API built from a different branch.
- Previews leave `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` unset: canonical URLs use
  the deployment's own URL, and the merchant area is at `/painel`. `robots.txt` blocks
  everything outside production.
- PRs from forks never deploy (they get no secrets).
- To ship several features together, keep their PRs open and merge them the same day.
- Rollback: revert the PR on `main`, or promote an earlier deployment in Vercel (web only;
  the API redeploys from `main`).

### Resetting the staging database

Migrations from abandoned branches stay in staging. To start over, open the Neon SQL editor
on the **staging** branch and run:

```sql
DROP SCHEMA public CASCADE;
DROP SCHEMA IF EXISTS drizzle CASCADE;
CREATE SCHEMA public;
```

Then re-run the `deploy-api` job of any open PR (or push to it): it migrates and seeds the
example stores. Never use Neon's "Reset from parent" on staging: it copies production data,
merchants' and customers' personal data included.

## API pipeline

1. `check` passes.
2. `pnpm db:migrate` against the target database (direct connection string).
3. `pnpm db:seed` upserts the example stores and replaces their products. It only touches
   ownerless stores with the example handles, which merchants cannot register.
4. Docker image built from `apps/api/Dockerfile`, pushed to Artifact Registry (`banquinha/api:<sha>`).
5. `gcloud run deploy` with secrets from Secret Manager: `banquinha-api` on a push to `main`,
   `banquinha-api-staging` (secrets suffixed `-staging`) on a pull request.

Migrations run before the new revision serves traffic, so every migration must work with the
previous API version too (add columns before using them, drop them a release later).

## GitHub configuration

Staging uses suffixed repository variables and secrets rather than GitHub Environments,
which private repositories only get on paid plans.

Repository **variables** (Settings → Secrets and variables → Actions → Variables):

| Name                    | Value                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`        | GCP project ID                                                                     |
| `GCP_WIF_PROVIDER`      | `projects/<number>/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_DEPLOYER_SA`       | `github-deployer@<project>.iam.gserviceaccount.com`                                |
| `WEB_ORIGIN`            | Public URL of the web app (CORS)                                                   |
| `R2_PUBLIC_URL_STAGING` | Public URL of the staging bucket, no trailing slash                                |

Repository **secrets**:

| Name                          | Value                                             |
| ----------------------------- | ------------------------------------------------- |
| `DATABASE_URL_DIRECT`         | Neon `production` branch, direct (non-pooler) URL |
| `DATABASE_URL_DIRECT_STAGING` | Neon `staging` branch, direct (non-pooler) URL    |

Protect `main` with a branch ruleset (Settings → Rules → Rulesets → New branch ruleset,
target the default branch): require a pull request, require the `check` status check and
block force pushes. Rulesets on private repositories need GitHub Pro; on Free, keep the
habit of never pushing to `main` directly.

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

### Staging secrets

The staging service runs as the same `banquinha-api` service account; only its secrets
differ. In Cloud Shell, with the variables from the block above:

```bash
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create internal-api-key-staging --data-file=-
for SECRET in internal-api-key-staging database-url-staging r2-access-key-id-staging r2-secret-access-key-staging; do
  gcloud secrets describe "$SECRET" >/dev/null 2>&1 || gcloud secrets create "$SECRET" --replication-policy=automatic
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$RUNTIME_SA" --role=roles/secretmanager.secretAccessor
done
```

Then add a version to each of the three empty secrets, one at a time, the same way as
`database-url`: run `read -rs VALUE` alone, paste the value, then
`printf '%s' "$VALUE" | gcloud secrets versions add <secret> --data-file=- && unset VALUE`.

| Secret                         | Value                                     |
| ------------------------------ | ----------------------------------------- |
| `database-url-staging`         | Neon `staging` branch, **pooled** URL     |
| `r2-access-key-id-staging`     | Access key id of the staging R2 token     |
| `r2-secret-access-key-staging` | Secret access key of the staging R2 token |

The first PR push creates the `banquinha-api-staging` service. Its URL
(`https://banquinha-api-staging-<number>.southamerica-east1.run.app`) shows in the job log
and in the Cloud Run console.

## Vercel environment variables

| Name                       | Production                                                      | Preview                                                            |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`      | `https://banquinha-api-877698749664.southamerica-east1.run.app` | URL of `banquinha-api-staging`                                     |
| `INTERNAL_API_KEY`         | Secret `internal-api-key` (Sensitive)                           | Secret `internal-api-key-staging` (Sensitive)                      |
| `R2_PUBLIC_URL`            | `https://img.banquinha.app`                                     | Public URL of the staging bucket                                   |
| `NEXT_PUBLIC_SITE_URL`     | `https://banquinha.app`                                         | Unset: the deployment's own URL is used (`NEXT_PUBLIC_VERCEL_URL`) |
| `NEXT_PUBLIC_APP_URL`      | `https://minha.banquinha.app`                                   | Unset: the merchant area is at `/painel`                           |
| `NEXT_PUBLIC_POSTHOG_KEY`  | Project key                                                     | Unset                                                              |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host                                                    | Unset                                                              |

Read a secret value with `gcloud secrets versions access latest --secret=<name>`.

`NEXT_PUBLIC_*` values are inlined at build time: redeploy after changing them.

Previews are private: Settings → Deployment Protection → Vercel Authentication, on with
**Standard Protection** (every preview plus the generated production URLs; the custom
production domains stay public). To open a preview on a phone, sign in to Vercel there once,
or create a Shareable Link from the deployment's Share menu.

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
3. R2 object storage → Overview → **Account Details** → **API Tokens: Manage** → **Create
   Account API token**, permission **Object Read & Write**, scoped to that bucket only. The
   confirmation screen shows the Access Key ID and the Secret Access Key once: copy both.

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
Staging uses its own bucket, `banquinha-images-staging`: repeat steps 1–3 for it (public
access through its `r2.dev` URL is enough) with a token scoped to that bucket only. Its keys
go to the `-staging` secrets and its public URL to `R2_PUBLIC_URL_STAGING` (GitHub) and
`R2_PUBLIC_URL` (Vercel, Preview).
Function region: `gru1` (Settings → Functions).
