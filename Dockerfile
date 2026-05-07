# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_FRAPPE_BACKEND=https://rcistoc.cronbi.com
ARG VITE_SELLER_PANEL_URL=/panel/
ARG VITE_API_URL=/api
ENV VITE_FRAPPE_BACKEND=$VITE_FRAPPE_BACKEND
ENV VITE_SELLER_PANEL_URL=$VITE_SELLER_PANEL_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npx vite build

# ---- Serve Stage ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Runtime backend hedefi: nginx:alpine'in /docker-entrypoint.d/20-envsubst-on-templates.sh
# script'i /etc/nginx/templates/*.template dosyalarını envsubst ile işleyip
# /etc/nginx/conf.d/ altına yazıyor. Default RC; BETA/PROD için compose'da override.
ENV BACKEND_DOMAIN=rcistoc.cronbi.com
ENV FRONTEND_DOMAIN=rc.istoc.com
# nginx'in kendi $remote_addr / $http_origin gibi değişkenlerine dokunmasın diye
# substitute edilecek değişkenleri whitelist'le.
ENV NGINX_ENVSUBST_FILTER="^(BACKEND_DOMAIN|FRONTEND_DOMAIN)$"

EXPOSE 80
