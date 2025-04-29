# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source and environment files
COPY . .
COPY .env.production .env

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

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
