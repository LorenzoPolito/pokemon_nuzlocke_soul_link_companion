# syntax=docker/dockerfile:1

# Pokédex stage: downloads PokeAPI/api-data at the commit pinned in
# data/pokedex-source.json and generates the read-only SQLite file. It uses the
# Debian image because it ships git; only the generated file leaves this stage.
# The data are fetched before the code is copied, so code changes do not download them again.
FROM node:22-bookworm AS pokedex
WORKDIR /work
COPY scripts/fetch-api-data.sh scripts/fetch-api-data.sh
COPY data/pokedex-source.json data/pokedex-source.json
RUN sh scripts/fetch-api-data.sh /api-data
COPY scripts/build-pokedex.ts scripts/build-pokedex.ts
COPY src/lib/server/pokedex/schema.ts src/lib/server/pokedex/schema.ts
RUN node --no-warnings scripts/build-pokedex.ts \
      --source /api-data/data/api/v2 \
      --out /pokedex/pokedex.sqlite \
      --commit "$(git -C /api-data rev-parse HEAD)" \
    && chmod 444 /pokedex/pokedex.sqlite

# Build stage: installs everything and compiles the app. Nothing from here
# except the build output and production dependencies reaches the final image.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Final stage: runtime only, no build tools, non-root user.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data \
    MIGRATIONS_DIR=/app/drizzle \
    POKEDEX_PATH=/app/pokedex/pokedex.sqlite
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY --from=pokedex /pokedex/pokedex.sqlite ./pokedex/pokedex.sqlite
COPY package.json ./

# The data directory belongs to the unprivileged user *before* it is declared
# as a volume: a new named volume inherits this owner.
RUN mkdir /data && chown node:node /data
VOLUME /data

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "build/index.js"]
