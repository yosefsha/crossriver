# Use the official Node.js image as the base image
FROM node:14 AS build
ARG API_URL
ENV REACT_APP_API_URL=$API_URL
# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire React app
COPY . .

# Build the React app for production
RUN npm run build

# Serve the app using a simple server
FROM nginx:alpine

# Copy the build output to the Nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Command to run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]