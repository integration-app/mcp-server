FROM node:22-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --no-fund --no-audit

# Copy source code
COPY . .

# Expose the port (you may need to adjust this based on your server configuration)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]