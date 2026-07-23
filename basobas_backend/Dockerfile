# BasoBas backend (Express + TypeScript, run via tsx). Reproducible image.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching). Uses the committed
# package-lock.json so builds are deterministic.
COPY package*.json ./
RUN npm ci

# App source
COPY . .

# Uploaded files live here (mounted as a volume in docker-compose).
RUN mkdir -p uploads/profile-pictures uploads/property-images

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["npm", "run", "start"]
