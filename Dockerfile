# Multi-stage production container for EasyInvite
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies first (optimized layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY server.js app.js index.html styles.css easyinvite.png ./

# Create non-root user for security
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
