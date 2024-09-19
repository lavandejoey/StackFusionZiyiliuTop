# Use the official Ubuntu 22.04 base image
FROM ubuntu:22.04

# Set the working directory inside the container
WORKDIR /root/ziyiliu-top

## Install Node.js, npm, and necessary dependencies
RUN apt-get update && apt-get upgrade -y && apt-get install -y curl git
# installs nvm (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# download and install Node.js (you may need to restart the terminal)
RUN /bin/bash -c "source /root/.bashrc && nvm install 20"
## Install Express & Generator
RUN /bin/bash -c "npm install -g express-generator
RUN apt-get clean
#RUN npm install -g express-generator

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
#RUN npm install && npm rebuild node-sass
RUN npm install
RUN npm audit fix --force

# Copy the rest of the application source code
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
