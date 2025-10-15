# Multi-stage build for optimal production image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy build files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S musicpad -u 1001

# Set proper permissions
RUN chown -R musicpad:nodejs /usr/share/nginx/html && \
    chown -R musicpad:nodejs /var/cache/nginx && \
    chown -R musicpad:nodejs /var/log/nginx && \
    chown -R musicpad:nodejs /etc/nginx/conf.d

# Switch to non-root user
USER musicpad

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]