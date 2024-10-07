# Use the official Ubuntu 22.04 base image
FROM node:20-alpine as build

# Set the working directory inside the container
WORKDIR /etc/ziyiliu.top

# Expose the port the app will run on
EXPOSE 2069

# Define the command to run the application
CMD ["npm", "start"]
