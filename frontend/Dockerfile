FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# * Vite inlines VISIBLE_ variables and resolves `base` at build time,
# * so they must be present during `npm run build`.
ARG BASE_URL
ARG VISIBLE_WS_BACKEND_URL
ARG VISIBLE_METRICS_SENDING_INTERVAL_SECONDS
ARG VISIBLE_METRICS_RETAINING_TIME_DAYS
ENV BASE_URL=$BASE_URL
ENV VISIBLE_WS_BACKEND_URL=$VISIBLE_WS_BACKEND_URL
ENV VISIBLE_METRICS_SENDING_INTERVAL_SECONDS=$VISIBLE_METRICS_SENDING_INTERVAL_SECONDS
ENV VISIBLE_METRICS_RETAINING_TIME_DAYS=$VISIBLE_METRICS_RETAINING_TIME_DAYS
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN npm install serve -g

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 443

CMD ["serve", "-s", "dist", "-l", "443"]
