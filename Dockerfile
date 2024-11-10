# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set the working directory in the container to /app/application
WORKDIR /app/application

# Copy package.json, package-lock.json, and tsconfig.json from the application folder to the container
COPY application/package.json application/package-lock.json application/tsconfig.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Install ts-node for running TypeScript without compiling
RUN npm install ts-node

# Install nodemon globally for running the application in development mode
RUN npm install -g nodemon

# Copy the rest of the application files into the container
COPY application/ ./

# Expose the application port
EXPOSE 3000

# Build the TypeScript project
RUN tsc

# Start the application with nodemon (use ts-node for dev)
CMD ["nodemon", "index.ts"]
