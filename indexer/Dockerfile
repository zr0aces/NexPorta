FROM node:22-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js extractor.js scanner.js builder.js ./
RUN mkdir -p /data && chown nodejs:nodejs /data
USER nodejs
CMD ["node", "index.js"]
