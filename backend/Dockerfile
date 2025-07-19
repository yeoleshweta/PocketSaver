# ────────────────────────────────────────────────────────────────
# backend/Dockerfile
# ────────────────────────────────────────────────────────────────

# 1) Pick a slim Node base
FROM node:20-slim

# 2) Create app directory
WORKDIR /usr/src/app

# 3) Install build tools (needed to compile bcrypt)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      python3 \
 && rm -rf /var/lib/apt/lists/*

# 4) Copy only package manifests
COPY package*.json ./

# 5) Install dependencies (including bcrypt) inside the image
RUN npm install

# 6) Force-rebuild bcrypt’s native binding for Linux
RUN npm rebuild bcrypt --build-from-source

# 7) Copy the rest of your source code
COPY . .

# 8) Expose and run in “dev” mode (nodemon watches for changes)
EXPOSE 5000
CMD ["npm", "run", "dev"]