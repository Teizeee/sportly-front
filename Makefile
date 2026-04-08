.PHONY: help install dev build preview lint docker-build docker-run docker-stop clean clean-all

IMAGE ?= ghcr.io/teizeee/sportly-front:latest
CONTAINER ?= sportly-front
PORT ?= 3000
VITE_API_BASE_URL ?= /api/v1/

help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run local dev server"
	@echo "  make build         - Build frontend assets"
	@echo "  make preview       - Preview production build locally"
	@echo "  make lint          - Run linter"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run frontend container on localhost:3000"
	@echo "  make docker-stop   - Stop and remove frontend container"
	@echo "  make clean         - Remove local build artifacts"
	@echo "  make clean-all     - Clean artifacts and dangling Docker images"

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview -- --host 0.0.0.0 --port $(PORT)

lint:
	npm run lint

docker-build:
	docker buildx build . -t $(IMAGE) --build-arg VITE_API_BASE_URL=$(VITE_API_BASE_URL) --load

docker-run:
	docker run -d --name $(CONTAINER) -p $(PORT):80 $(IMAGE)
	@echo "Frontend is running at http://localhost:$(PORT)"

docker-stop:
	-docker rm -f $(CONTAINER)

clean:
	-rm -rf dist

clean-all: clean
	docker image prune -f
