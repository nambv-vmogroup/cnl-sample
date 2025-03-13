# Stage 1: Build
FROM node:18 as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build the application (for example, transpile TypeScript or bundle front-end assets)
RUN npm run build

# Stage 2: Production
FROM node:18-slim as production-stage

# Set the working directory
WORKDIR /app

# Copy only the build artifacts and essential files from the build stage
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose the application port
EXPOSE 3000

# Define the command to run the app
CMD ["node", "dist/src/main.js"]