# frontend/Dockerfile
FROM node:20-slim

WORKDIR /app

# inject during build so `process.env.NEXT_PUBLIC_API_URL` is baked in
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
RUN npm install

COPY . .

# for dev you want this; PROD you'd `RUN npm run build` then `CMD ["npm", "run", "start"]`
EXPOSE 3000
CMD ["npm", "run", "dev"]