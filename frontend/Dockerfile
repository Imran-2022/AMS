# syntax=docker/dockerfile:1

########################
# Dependencies
########################
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

########################
# Build
########################
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Requires `output: 'standalone'` in next.config.js, which is only enabled
# when DOCKER_BUILD=true is set (see next.config.js) - keeps Netlify builds
# (which must NOT use standalone output) unaffected.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV DOCKER_BUILD=true
RUN npm run build

########################
# Runtime
########################
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]