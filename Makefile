NETWORK_NAME=investing-platform-network
DOCKER_COMPOSE_FILE=docker-compose.yml
INVESTING_PLATFORM_DB_PATH=./db/investing-platform-db/data
INVESTING_PLATFORM_DB_CONTAINER=investing-platform-db
WEBAPP_DIR=crypto-investing-platform-web
PRISMA_SCHEMA=db/prisma/schema.prisma

run: ## run application ## run
	cd ${WEBAPP_DIR} && bun run dev

build-db: ## build db ## build-db
	docker network create ${NETWORK_NAME} || true
	docker compose -f ${DOCKER_COMPOSE_FILE} build ${INVESTING_PLATFORM_DB_CONTAINER}

run-db: ## run db ## run-db
	docker compose -f ${DOCKER_COMPOSE_FILE} up -d ${INVESTING_PLATFORM_DB_CONTAINER}

delete-db: ## delete db volume(postgreSQL) ## delete-db
	rm -rf ${INVESTING_PLATFORM_DB_PATH}
	docker rm -f ${INVESTING_PLATFORM_DB_CONTAINER}.internal
	docker compose -f ${DOCKER_COMPOSE_FILE} rm -v -s ${INVESTING_PLATFORM_DB_CONTAINER}

db-generate: ## generate Prisma client ## db-generate
	cd ${WEBAPP_DIR} && bunx prisma generate --schema=../${PRISMA_SCHEMA}

db-migrate: ## create and apply migration (development) ## db-migrate-dev
	cd ${WEBAPP_DIR} && bunx prisma migrate dev --schema=../${PRISMA_SCHEMA}

db-push: ## push schema to database (development) ## db-push
	cd ${WEBAPP_DIR} && bunx prisma db push --schema=../${PRISMA_SCHEMA}

db-studio: ## open Prisma Studio (database browser) ## db-studio
	cd ${WEBAPP_DIR} && bunx prisma studio --schema=../${PRISMA_SCHEMA}

db-format: ## format Prisma schema ## db-format
	cd ${WEBAPP_DIR} && bunx prisma format --schema=../${PRISMA_SCHEMA}

db-validate: ## validate Prisma schema ## db-validate
	cd ${WEBAPP_DIR} && bunx prisma validate --schema=../${PRISMA_SCHEMA}

db-reset: ## reset database and apply all migrations ## db-reset
	cd ${WEBAPP_DIR} && bunx prisma migrate reset --schema=../${PRISMA_SCHEMA}

db-seed: ## seed database (if seed script exists) ## db-seed
	cd ${WEBAPP_DIR} && bunx prisma db seed --schema=../${PRISMA_SCHEMA}

test: ## run all tests (frontend and backend) ## test
	cd ${WEBAPP_DIR} && bunx vitest run src/server && bunx vitest run src/app --passWithNoTests

test-fe: ## run frontend tests only ## test-fe
	cd ${WEBAPP_DIR} && bunx vitest run src/app --passWithNoTests

test-be: ## run backend tests only ## test-be
	cd ${WEBAPP_DIR} && bunx vitest run src/server

# help で表示するためコマンドの定義は以下のように記述
# {コマンド}: ## {コマンドの説明} ## {引数使用の場合のコマンドを記述}
help: ## コマンド一覧を表示 ## make help
	@echo ""
	@echo "Command list:"
	@printf "\033[36m%-35s\033[0m %s\n" "[Sub command]" "[Description]"
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | perl -pe 's%^([/a-zA-Z_-]+):.*?(##)%$$1 $$2%' | awk -F " *?## *?" '{printf "\033[36m%-35s\033[0m %s\n", $$3 ? $$3 : $$1, $$2}'
	@echo ''
