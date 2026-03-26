FROM node:22-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Copy package.json files for all workspaces (for dependency resolution)
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/package.json ./packages/prisma/

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/prisma/ ./packages/prisma/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN npx prisma generate --schema=packages/prisma/schema.prisma

# Build the API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:22-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/package.json ./packages/prisma/

RUN npm install --omit=dev

COPY --from=base /app/packages/shared/ ./packages/shared/
COPY --from=base /app/packages/prisma/ ./packages/prisma/
COPY --from=base /app/apps/api/dist/ ./apps/api/dist/
COPY --from=base /app/node_modules/.prisma/ ./node_modules/.prisma/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "apps/api/dist/index.js"]
