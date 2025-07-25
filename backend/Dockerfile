# Use the official Node.js runtime as the base image
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S eagleeye -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R eagleeye:nodejs /app
USER eagleeye

# Expose the port the app runs on
EXPOSE 5000

# Define environment variable
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
