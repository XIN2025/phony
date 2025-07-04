FROM node:22.16.0-slim AS base

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install

RUN pnpm run build

CMD ["pnpm", "run", "start"]
