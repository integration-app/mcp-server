# Use the official Node.js 18 image as the base image for building
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm install

# Copy the rest of the application source code to the working directory
COPY . .

# Build the application
RUN npm run build

# Use a smaller Node.js image for the production environment
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# Install only production dependencies
RUN npm ci --omit=dev

# Set environment variables
ENV NODE_ENV=production

# Expose the port the app runs on (if applicable)
# EXPOSE 3000

# Command to run the application
ENTRYPOINT ["node", "dist/index.js"]