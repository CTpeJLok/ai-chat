start:
	docker-compose up -d

stop:
	docker-compose down

restart: stop start

logs:
	docker-compose logs -f

start-build:
	docker-compose up -d --build

restart-build: stop start-build
