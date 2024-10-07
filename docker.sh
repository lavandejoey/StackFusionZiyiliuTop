#!/bin/bash

# ziyiliu.top Express Docker Deployment Script

# This script builds and deploys the Express app using Docker.
# It assumes that the script is located in the git repository,
# and that it is being run from the repository root directory.

# Define image and container names
IMAGE_NAME="ziyiliu.top"
CONTAINER_NAME="ziyiliu.top"
APP_DIR="/app/ziyiliu.top-by-express"

# Log function
LOG() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2"
}

# Function to check if a command exists
command_exists() {
    if ! command -v "$1" &>/dev/null; then
        LOG "ERROR" "Command '$1' not found. Please install it."
        exit 1
    fi
}

# Function to check the success of each command
check_success() {
    if [ $2 -ne 0 ]; then
        LOG "ERROR" "$1 failed. Exiting."
        exit 1
    else
        LOG "INFO" "$1 succeeded."
    fi
}

# Check for required commands
command_exists git
command_exists sudo
command_exists docker

# Pull latest changes from the repository
LOG "INFO" "Pulling latest changes from the repository..."
cd "$APP_DIR" || exit
git pull
exit_status=$?
check_success "Updating the repository" $exit_status

# Install dependencies on the host
LOG "INFO" "Installing dependencies..."
npm install --omit=dev
exit_status=$?
check_success "Installing dependencies" $exit_status

# Remove existing Docker image and container if they exist
if sudo docker ps -a --format '{{.Names}}' | grep -Eq "^$CONTAINER_NAME$"; then
    LOG "INFO" "Stopping existing container..."
    sudo docker stop "$CONTAINER_NAME"
    exit_status=$?
    check_success "Stopping existing container" $exit_status

    LOG "INFO" "Removing existing container..."
    sudo docker rm "$CONTAINER_NAME"
    exit_status=$?
    check_success "Removing existing container" $exit_status
fi

if sudo docker images --format '{{.Repository}}:{{.Tag}}' | grep -Eq "^$IMAGE_NAME"; then
    LOG "INFO" "Removing existing image..."
    sudo docker rmi "$IMAGE_NAME"
    exit_status=$?
    check_success "Removing existing image" $exit_status
fi

# Build the Docker image
LOG "INFO" "Building the Docker image..."
sudo docker build --no-cache -t "$IMAGE_NAME" .
exit_status=$?
check_success "Building the Docker image" $exit_status

# Run the Docker container with a bind mount
LOG "INFO" "Running the Docker container with a bind mount..."
sudo docker run -d --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 127.0.0.1:2069:2069 \
    -v "$APP_DIR":"$APP_DIR" \
    -v /var/log:/var/log \
    "$IMAGE_NAME"
exit_status=$?
check_success "Running the Docker container" $exit_status

# Clean up unused Docker resources
LOG "INFO" "Cleaning up unused Docker resources..."
sudo docker system prune -af --volumes
exit_status=$?
check_success "Cleaning up Docker resources" $exit_status

# Show running containers
LOG "INFO" "Deployment complete. Running containers:"
sudo docker ps
