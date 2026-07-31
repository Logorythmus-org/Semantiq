FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json vitest.config.mjs eslint.config.mjs .prettierrc turbo.json docker-compose.yml ./
COPY README.md LICENSE CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md ROADMAP.md ARCHITECTURE.md TECH_STACK.md ./
COPY .env.example .env.test.example .gitignore .editorconfig .gitattributes ./

RUN --mount=type=cache,id=techclub-pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile

COPY apps ./apps
COPY examples ./examples
COPY packages ./packages
COPY services ./services
COPY tooling ./tooling
COPY tools ./tools
COPY scripts ./scripts
COPY tests ./tests

RUN --mount=type=cache,id=techclub-pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile

CMD ["node", "--experimental-strip-types", "--experimental-loader", "./scripts/ts-loader.mjs", "services/api/src/docker-server.ts"]
