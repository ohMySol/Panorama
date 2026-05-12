#!/bin/bash

echo "Starting Panorama..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found. Make sure Docker Desktop is up to date."
    exit 1
fi

echo "Building and starting containers..."
docker compose up --build -d

echo ""
echo "Panorama is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "View logs: docker compose logs -f"
echo "Stop:      docker compose down"
