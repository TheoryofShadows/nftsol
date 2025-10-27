FROM node:20-alpine
WORKDIR /app

# Install prod deps, then tsx to run TS directly (no compile phase)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
 && npm install tsx

COPY . .

ENV NODE_ENV=production
ENV PORT=3003
EXPOSE 3003

CMD ["npx", "tsx", "src/ipfsProxyStandalone.ts"]
