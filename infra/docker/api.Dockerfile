FROM node:20-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter ./apps/api...
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

USER node
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
