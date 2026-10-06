FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN corepack enable && pnpm install --frozen-lockfile --filter ./apps/api...
RUN pnpm --filter api build
CMD ["node", "apps/api/dist/main.js"]
