# ---------- build image ----------
  FROM node:20-slim

  # If you ever need native addons; otherwise drop build-tools
  RUN apt-get update && \
      apt-get install -y --no-install-recommends \
        build-essential python3 && \
      rm -rf /var/lib/apt/lists/*
  
  WORKDIR /usr/src/app
  
  # ----- install deps (package.json + lock file) -----
  COPY package*.json ./
  RUN npm install
  
  # ----- copy source -----
  COPY . .
  
  # let Docker know which port the app listens on (inside the container)
  EXPOSE 5000
  
  CMD ["npm", "run", "dev"]
  