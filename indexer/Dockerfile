FROM node:22-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js extractor.js scanner.js builder.js server.js ./
RUN mkdir -p /data && chown nodejs:nodejs /data
USER nodejs
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD test -f /data/index.json || exit 1
CMD ["node", "index.js"]
