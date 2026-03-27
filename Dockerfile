# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_FRAPPE_BACKEND=https://rcistoc.cronbi.com
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRAPPE_BACKEND=$VITE_FRAPPE_BACKEND
RUN npx vite build

# ---- Serve Stage ----
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
