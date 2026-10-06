FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN corepack enable && pnpm install --frozen-lockfile --filter ./apps/web...
RUN pnpm --filter web build
CMD ["pnpm", "--filter", "web", "start"]
