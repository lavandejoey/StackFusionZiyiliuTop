# Use the official Node.js 20 Alpine base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app/ziyiliu.top-by-express

# Install required packages
RUN apk add --no-cache autossh

# Expose the port the app runs on
EXPOSE 2069

# Define environment variables
ENV NODE_ENV=production

# Define the command to run the application
CMD ["npm", "start"]
