# Stage 0: base node setup

FROM node:16.18-alpine3.15@sha256:9598b4e253236c8003d4e4b1acde80a6ca781fc231a7e670ecc2f3183c94ea5e AS base

LABEL maintainer="Nikita Mezhenskyi <nmezhenskyi@myseneca.ca>"
LABEL description="Fragments node.js microservice"

ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

RUN apk add --no-cache dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

#####################################################################

# Stage 1: install dependencies

FROM node:16.18-bullseye@sha256:91473f227fcf3e4af8f2acfa1eeee922c0712d7bc4654f12a041b33259a8dd7c AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

#####################################################################

# Stage 2: production

FROM base AS production

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

RUN chown -R node:node /app
RUN chmod 750 /app
USER node

COPY --from=dependencies /app /app

COPY ./tests/.htpasswd ./tests/.htpasswd

COPY ./src ./src

EXPOSE 8080

HEALTHCHECK --interval=1m --timeout=30s --start-period=10s --retries=3 \
  CMD curl -f localhost:8080 || exit 1

CMD ["node", "src/index.js"]

#####################################################################
