FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Vite inlines every VITE_* value at BUILD time, so they have to exist while
# `npm run build` runs. Railway passes a service's variables to the build as build
# args, but a Docker build only sees them once they are declared with ARG — without
# these lines the build only ever saw .env.production and silently shipped a bundle
# with no Reverb host or key.
ARG VITE_API_URL
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

# Write only the NON-EMPTY args into .env.production.local, which Vite loads ahead of
# .env.production. Exporting them unconditionally would set empty strings, and an empty
# value OVERRIDES the committed default instead of falling back to it — that would blank
# VITE_API_URL and take the whole app down whenever an arg is not supplied.
RUN : > .env.production.local \
 && for v in VITE_API_URL VITE_REVERB_APP_KEY VITE_REVERB_HOST VITE_REVERB_PORT VITE_REVERB_SCHEME; do \
      eval "val=\$$v"; \
      if [ -n "$val" ]; then echo "$v=$val" >> .env.production.local; fi; \
    done \
 && echo "build env:" && cat .env.production.local \
 && npm run build

FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
