FROM node:20-alpine
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter ./apps/web...
RUN pnpm --filter web build

USER node
EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
