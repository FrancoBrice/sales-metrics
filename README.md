# Vambe Sales Metrics

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Project-blue?style=for-the-badge)](https://sales-metrics-ia.netlify.app/)

Panel interactivo para análisis inteligente de métricas de ventas basado en transcripciones de reuniones. Extrae automáticamente insights con IA, identifica patrones y genera visualizaciones interactivas.

## Funcionalidades Principales

- **Importar CSV**: Sube archivos CSV con datos de clientes y reuniones para procesamiento masivo
- **Analizar Pendientes**: Procesa automáticamente todas las transcripciones pendientes y reintenta las extracciones fallidas con IA

## Inicio Rápido

### Prerrequisitos
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Make

### Instalación

#### Opción 1: Con Makefile (Recomendado)
```bash
# Setup completo (primera vez)
make setup

# Configurar variables de entorno (apps/api/.env)
DATABASE_URL="postgresql://vambe:vambe_secret@localhost:5433/sales_metrics"
DEEPSEEK_API_KEY="your-key"

# Iniciar desarrollo
make dev

# Detener desarrollo
make down
```

#### Opción 2: Manual
```bash
# Instalar dependencias
pnpm install

# Iniciar PostgreSQL
docker-compose up -d

# Configurar variables de entorno (apps/api/.env)
DATABASE_URL="postgresql://vambe:vambe_secret@localhost:5433/sales_metrics"
DEEPSEEK_API_KEY="your-key"
API_PORT=3001

# Generar cliente Prisma
pnpm db:generate

# Crear esquema de base de datos
pnpm db:push

# Iniciar desarrollo
pnpm dev
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Demo en Vivo

[Ver aplicación en producción](https://sales-metrics-ia.netlify.app/)

La aplicación está desplegada en Koyeb + Supabase para el backend y base de datos y netlify para el frontend.

## Documentación

[Documentación completa](docs/)

- **[Decisiones Técnicas](docs/api/Documentacion.md)** - Arquitectura, funcionalidades y decisiones técnicas detalladas
- **[Guía de Gráficos](docs/graficos-analisis.md)** - Explicación detallada de cada visualización