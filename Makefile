.PHONY: help setup dev db-up db-down db-reset clean install

help: ## Mostrar comandos disponibles
	@echo "Comandos disponibles:"
	@echo "  make setup     - Setup completo del proyecto (primera vez)"
	@echo "  make dev       - Iniciar desarrollo (DB + API + Web)"
	@echo "  make db-up     - Iniciar solo PostgreSQL"
	@echo "  make db-down   - Detener PostgreSQL"
	@echo "  make db-reset  - Resetear base de datos"
	@echo "  make clean     - Limpiar todo (DB + node_modules)"
	@echo "  make install   - Instalar dependencias"

setup: ## Setup inicial completo
	@echo "[1/5] Instalando dependencias..."
	@pnpm install
	@echo "[2/5] Iniciando PostgreSQL..."
	@docker-compose up -d
	@echo "[3/5] Esperando que PostgreSQL este listo..."
	@until docker exec vambe-postgres pg_isready -U vambe -d sales_metrics > /dev/null 2>&1; do sleep 1; done
	@echo "[4/5] Generando cliente Prisma..."
	@pnpm db:generate
	@echo "[5/5] Creando esquema de base de datos..."
	@pnpm db:push
	@echo ""
	@echo "Setup completo!"
	@echo "Ejecuta 'make dev' para iniciar el desarrollo"
	@echo ""
	@echo "URLs:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - API:      http://localhost:3001"
	@echo "  - API Docs: http://localhost:3001/docs"

dev: db-up ## Iniciar desarrollo
	@echo "Iniciando desarrollo..."
	@pnpm dev

db-up: ## Iniciar PostgreSQL
	@docker-compose up -d
	@echo "PostgreSQL corriendo en localhost:5433"

db-down: ## Detener PostgreSQL
	@docker-compose down
	@echo "PostgreSQL detenido"

db-reset: ## Resetear base de datos
	@echo "Reseteando base de datos..."
	@docker-compose down -v
	@docker-compose up -d
	@until docker exec vambe-postgres pg_isready -U vambe -d sales_metrics > /dev/null 2>&1; do sleep 1; done
	@pnpm db:push
	@echo "Base de datos reseteada"

install: ## Instalar dependencias
	@pnpm install

clean: ## Limpiar todo
	@echo "Limpiando contenedores y volumenes..."
	@docker-compose down -v
	@echo "Limpiando node_modules..."
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@echo "Limpieza completa"
