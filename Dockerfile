# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

 
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Install pnpm globally and required system tools
RUN npm install -g pnpm@10.0.0

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./

# Copy all package.json files explicitly to ensure workspace structure
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies including Prisma globally
RUN npm install -g prisma@6.6.0 @nestjs/cli@11.0.0 typescript@5.8.2 && \
    pnpm install

# Copy source code after dependency installation
COPY . .

# Generate Prisma client
RUN cd packages/db && prisma generate

# Build shared packages first
RUN cd packages/shared-types && pnpm run build

# Build server application
RUN cd apps/server && nest build

 
RUN cd apps/web && pnpm build

 
FROM node:20-alpine AS server-production

# Install pnpm and required global tools
RUN npm install -g pnpm@10.0.0

WORKDIR /app

# Copy package files for production dependencies
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/

# Copy built server application and necessary files
COPY --from=base /app/apps/server/dist ./apps/server/dist
COPY --from=base /app/packages/db/generated ./packages/db/generated
COPY --from=base /app/packages/db/package.json ./packages/db/
COPY --from=base /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=base /app/packages/shared-types/package.json ./packages/shared-types/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Create uploads directory
RUN mkdir -p ./uploads

# Expose port
EXPOSE 3001

# Start the server in production mode
CMD ["node", "apps/server/dist/main.js"]

# --------------------------------------------------------------------
# Production stage for frontend web
# --------------------------------------------------------------------
FROM node:20-alpine AS web-production

# Install pnpm
RUN npm install -g pnpm@10.0.0

WORKDIR /app

# Copy package files for production dependencies
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# Copy built web application and necessary files
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=base /app/packages/shared-types/package.json ./packages/shared-types/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Expose port
EXPOSE 3000

# Start Next.js in production mode
CMD ["pnpm", "--filter", "web", "start"]
