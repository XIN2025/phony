FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/db run db:generate
RUN pnpm --filter server build

RUN pnpm prune --prod

FROM node:20-alpine AS release
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3001

CMD ["node", "apps/server/dist/main.js"]
