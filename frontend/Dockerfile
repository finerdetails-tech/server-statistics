FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN npm install serve -g

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
