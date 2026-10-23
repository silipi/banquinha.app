# syntax=docker/dockerfile:1
# Production image for the API (Google Cloud Run). Build from the repo root:
#   docker build -f apps/api/Dockerfile -t banquinha-api .

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# Manifests first so the dependency layers stay cached while only source code changes.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

FROM manifests AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @banquinha/api --fail-if-no-match
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN pnpm --filter @banquinha/api --fail-if-no-match build

FROM manifests AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @banquinha/api --fail-if-no-match --prod

FROM node:24-slim AS runtime
ENV NODE_ENV=production \
    API_PORT=8080 \
    TRUST_PROXY_HOPS=1
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/
USER node
WORKDIR /app/apps/api
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/main.js"]
