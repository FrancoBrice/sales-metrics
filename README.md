# Vambe Sales Metrics

Panel interactivo para análisis inteligente de métricas de ventas basado en transcripciones de reuniones. Extrae automáticamente insights con IA, identifica patrones y genera visualizaciones interactivas.

## 🚀 Inicio Rápido

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
- Docs API: http://localhost:3001/docs

## 📁 Arquitectura

```
├── apps/
│   ├── api/           # NestJS + PostgreSQL
│   │   ├── src/
│   │   │   ├── extract/      # Extracción IA (Regex + LLM)
│   │   │   ├── metrics/      # Analytics avanzados
│   │   │   └── ingest/       # Procesamiento CSV
│   └── web/           # Next.js + Recharts
├── packages/shared/   # Tipos, enums, schemas
└── docker-compose.yml
```

## 🔧 Comandos Disponibles

### Makefile (Recomendado)

| Comando | Descripción |
|---------|-------------|
| `make setup` | Setup completo del proyecto (primera vez) |
| `make dev` | Iniciar desarrollo (DB + API + Web) |
| `make db-up` | Iniciar solo PostgreSQL |
| `make db-down` | Detener PostgreSQL |
| `make db-reset` | Resetear base de datos |
| `make clean` | Limpiar todo (DB + node_modules) |
| `make install` | Instalar dependencias |

### Scripts pnpm

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar API + Web |
| `pnpm build` | Build producción |
| `pnpm test` | Ejecutar tests |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:migrate` | Migraciones DB |

## 🎯 Funcionalidades

### 📊 Dashboard Principal
- **Métricas generales**: Total clientes, cierres, conversión, volumen promedio
- **Análisis avanzados**: Matriz de oportunidades, probabilidad de cierre, heatmap industrias
- **Flujos de conversión**: Diagramas Sankey, embudos de ventas
- **Análisis temporal**: Evolución de leads, desempeño vendedores

### 🤖 Sistema de Extracción IA

**Arquitectura híbrida**: Regex determinístico + LLM

1. **Extracción determinística** (regex):
   - Fuentes de leads (LinkedIn, conferencias, recomendaciones)
   - Volumen de interacciones (mensajes/día, interacciones/semana)
   - Integraciones requeridas (CRM, tickets, reservas)

2. **Extracción LLM** (DeepSeek):
   - Clasificación industrial
   - Identificación de pain points
   - Análisis de modelos de negocio
   - Evaluación de riesgos
   - Análisis de sentimiento

### 📈 Visualizaciones Interactivas

- **Matriz de Oportunidades**: Volumen vs Tasa de Conversión
- **Heatmap Industrias**: Industry × Pain Points
- **Probabilidad de Cierre**: Análisis predictivo
- **Flujo de Conversión**: Diagrama Sankey
- **Embudo de Ventas**: Análisis de cierres por etapa
- **Pain Points**: Análisis de problemas comunes
- **Desempeño Vendedores**: Métricas por vendedor

### 🔍 Filtrado Avanzado

Filtrar por vendedor, estado (abierto/cerrado), fuente de leads, industria, rango de fechas.

## 🗄️ Base de Datos

**PostgreSQL** con Prisma ORM. Esquema optimizado para analytics:

- `Customer`: Información básica del cliente
- `Meeting`: Transcripciones de reuniones
- `Extraction`: Resultados de análisis IA
- `ExtractionData`: Datos estructurados extraídos
- `LlmApiLog`: Logs completos de llamadas IA

## 🧪 Testing

**Cobertura completa** con Vitest:
- **31 tests unitarios** en extractores determinísticos
- **Tests de integración** para flujo completo de extracción
- **Mocks** para dependencias externas

## 🚀 Deployment

### Frontend (Netlify)
- Build automático con `netlify.toml`
- Variables de entorno configurables

### Backend
- Desplegado en Koyeb

### Base de Datos
- **Desarrollo**: PostgreSQL en Docker
- **Producción**: Supabase o PostgreSQL managed

## 📝 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://vambe:vambe_secret@localhost:5433/sales_metrics` |
| `DEEPSEEK_API_KEY` | DeepSeek API key | - |
| `API_PORT` | Puerto API | `3001` |
| `NEXT_PUBLIC_API_URL` | URL API para frontend | `http://localhost:3001` |

## 📊 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/ingest/csv` | Subir CSV de clientes |
| `POST` | `/api/extract/bulk/all` | Extraer todos pendientes |
| `GET` | `/api/metrics/overview` | Métricas generales |
| `GET` | `/api/customers` | Listado filtrable |
| `GET` | `/api/metrics/by-dimension` | Métricas por dimensión |

## 🏗️ Decisiones Técnicas

- **Monorepo pnpm** para gestión eficiente de dependencias
- **Next.js 14** con App Router para frontend moderno
- **NestJS** para API robusta y escalable
- **Extracción híbrida** (determinística + IA) para máxima confiabilidad
- **DeepSeek LLM** para procesamiento de lenguaje natural
- **PostgreSQL** para analytics complejos
- **TypeScript** en todo el stack
- **Vitest** para testing rápido y confiable

## 📄 Licencia

MIT