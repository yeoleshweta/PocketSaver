# backend/Dockerfile
FROM node:20-slim

WORKDIR /usr/src/app

# Install build tools for native modules
RUN apt-get update \
  && apt-get install -y build-essential python3 --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
# Force rebuild bcrypt to match container arch
RUN npm rebuild bcrypt --build-from-source

COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]