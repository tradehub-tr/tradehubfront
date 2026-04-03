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
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
