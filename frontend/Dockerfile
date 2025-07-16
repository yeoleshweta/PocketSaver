# frontend/Dockerfile

#################################
# 1) Builder stage
#################################
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

#################################
# 2) Runner stage
#################################
FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "run", "start"]