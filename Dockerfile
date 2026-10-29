# Compile NestJS with development dependencies and Prisma Client.
FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate --config ./prisma7.config.ts
RUN npm run build

# Keep only runtime dependencies, generated Prisma Client, and compiled JavaScript.
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate --config ./prisma7.config.ts && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
