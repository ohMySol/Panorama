.PHONY: help dev up down build logs clean restart

help:
	@echo "Panorama Docker Commands:"
	@echo "  make dev       - Start development environment (detached)"
	@echo "  make up        - Start containers in foreground"
	@echo "  make down      - Stop containers"
	@echo "  make build     - Rebuild containers"
	@echo "  make logs      - Show logs"
	@echo "  make clean     - Remove all containers and volumes"
	@echo "  make restart   - Restart containers"

dev:
	docker compose up -d

up:
	docker compose up

down:
	docker compose down

build:
	docker compose up --build -d

logs:
	docker compose logs -f

clean:
	docker compose down -v

restart:
	docker compose restart
