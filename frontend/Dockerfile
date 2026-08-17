# ---------- Build stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# VITE_API_URL is baked in at build time. Leave unset to use the
# same-origin /api path that nginx.conf proxies to the api service.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

# Non-root runtime (nginx-unprivileged base image conventions applied manually)
RUN addgroup -g 1000 appgroup && adduser -D -u 1000 -G appgroup appuser \
    && mkdir -p /var/cache/nginx /var/run \
    && chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R appuser:appgroup /usr/share/nginx/html /etc/nginx/conf.d

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]