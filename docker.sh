#!/bin/bash

# Define image and container names
IMAGE_NAME="ziyiliu.top"
CONTAINER_NAME="ziyiliu.top"
PROJECT_ROOT="/etc/ziyiliu.top"
GIT_REPO="https://github.com/lavandejoey.git"

# Function to check the success of each command
check_success() {
    if [ $? -ne 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')]"[ERROR] $1 failed. Exiting."
        exit 1
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')]"[INFO] $1 succeeded."
    fi
}

# Clone or update the git repository
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Checking if project root exists and syncing with git repository..."
if [ -d "$PROJECT_ROOT" ]; then
    cd $PROJECT_ROOT || { echo "[$(date '+%Y-%m-%d %H:%M:%S')]"[ERROR] Failed to navigate to project root: $PROJECT_ROOT"; exit 1; }
    git pull origin main
    check_success "Updating git repository"
else
    git clone $GIT_REPO $PROJECT_ROOT
    check_success "Cloning git repository"
fi

# Go to the root path of project
cd $PROJECT_ROOT || { echo "[$(date '+%Y-%m-%d %H:%M:%S')]"[ERROR] Failed to navigate to project root: $PROJECT_ROOT"; exit 1; }

# Remove existing Docker image
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Removing existing Docker image if it exists..."
docker rmi -f $IMAGE_NAME 2>/dev/null
check_success "Removing existing Docker image"

# Build the Docker image
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Building the Docker image with tag: $IMAGE_NAME..."
docker build --no-cache -t $IMAGE_NAME .
check_success "Building Docker image"

# Stop and remove any running container with the same name
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Stopping and removing any existing container with the name: $CONTAINER_NAME..."
docker rm -f $CONTAINER_NAME 2>/dev/null
check_success "Stopping and removing container"

# Run the Docker container
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Running the Docker container with volumes and port mappings..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -v /var/log/v2ray:/var/log/v2ray \
  -v /etc/ziyiliu.top:/etc/ziyiliu.top \
  -p 127.0.0.1:2069:2069 \
  $IMAGE_NAME
check_success "Running Docker container"

# Install npm dependencies
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Installing npm dependencies..."
cd $PROJECT_ROOT || { echo "[$(date '+%Y-%m-%d %H:%M:%S')]"[ERROR] Failed to navigate to npm project directory"; exit 1; }
npm install --production
check_success "Installing npm dependencies"

# Clean up unused images, dangling images, and build caches to free up space
echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Cleaning up unused Docker data..."
docker builder prune -f
check_success "Cleaning up Docker builder"
docker image prune -f
check_success "Cleaning up Docker images"
docker container prune -f
check_success "Cleaning up Docker containers"
docker volume prune -f
check_success "Cleaning up Docker volumes"

# Enter the Docker container's bash shell (Optional)
#echo "[$(date '+%Y-%m-%d %H:%M:%S')]"Entering the Docker container's bash shell (you can exit with Ctrl+D)..."
#docker exec -it $CONTAINER_NAME /bin/bash
#check_success "Entering Docker bash shell"