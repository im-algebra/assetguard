#!/bin/bash

# AssetGuard EC2 Setup Script
echo "Starting AssetGuard Backend Setup..."

# Update system
sudo apt-get update -y

# Install Docker if not present
if ! [ -x "$(command -v docker)" ]; then
    echo "Installing Docker..."
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Build Docker Image
echo "Building Docker image..."
sudo docker build -t assetguard-backend .

# Stop and remove existing container if it exists
echo "Cleaning up old containers..."
sudo docker stop assetguard-api || true
sudo docker rm assetguard-api || true

# Run the container
echo "Starting container..."
# The user should provide MONGO_URI as an environment variable or edit this script
if [ -z "$MONGO_URI" ]; then
    echo "WARNING: MONGO_URI is not set. Please set it before running or provide it now."
    # Fallback to local if needed, but usually we want the ENV
fi

sudo docker run -d \
    --name assetguard-api \
    -p 5000:5000 \
    -e MONGO_URI="$MONGO_URI" \
    -e PORT=5000 \
    --restart always \
    assetguard-backend

echo "Setup Complete! API should be running on port 5000."
sudo docker ps
