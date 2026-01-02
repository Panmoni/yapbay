# Build stage
FROM node:20-alpine AS builder

# Install git for version generation
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm for better reliability in container builds
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set progress true && \
    npm config set loglevel verbose

# Install dependencies with progress indicators
RUN echo "Starting npm ci at $(date)..." && \
    npm ci --loglevel=info --progress=true && \
    echo "npm ci completed at $(date)"

# Copy application source and environment files
COPY . .
COPY .env.production .env

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expose port 5174
EXPOSE 5174

# Start the application
CMD ["serve", "-s", "dist", "-l", "5174"]
