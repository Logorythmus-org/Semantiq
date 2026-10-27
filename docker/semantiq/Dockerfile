# Experimental local-evaluation image. Not a production deployment.
FROM node:22-bookworm-slim

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

# The repository's .dockerignore excludes local .env files, git history and build artifacts.
COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV SEMANTIQ_HOST=0.0.0.0
ENV SEMANTIQ_PORT=8080

EXPOSE 8080
USER node

CMD ["pnpm", "exec", "tsx", "scripts/serve-semantiq-local.ts"]
