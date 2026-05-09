#!/bin/bash

echo "🚀 Starting Panorama..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

echo "📦 Building and starting containers..."
docker-compose up --build -d

echo ""
echo "✅ Panorama is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop:      docker-compose down"
