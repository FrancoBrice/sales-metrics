# Vambe Sales Metrics

Panel interactivo para análisis de métricas de clientes basado en transcripciones de reuniones de ventas, con extracción automática de categorías mediante LLM.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker and Docker Compose (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL database (Docker)
docker-compose up -d

# Configure environment variables
# Create or update apps/api/.env with:
# DATABASE_URL="postgresql://vambe:vambe_secret@localhost:5433/sales_metrics"

# Generate Prisma client
pnpm db:generate

# Push database schema (creates tables)
pnpm db:push

# Start development servers (API + Web)
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/docs

## 📁 Project Structure

```
repo/
├── apps/
│   ├── api/            # NestJS backend
│   │   ├── prisma/     # Database schema & migrations
│   │   └── src/
│   │       ├── customers/    # Customer listing & filtering
│   │       ├── extract/      # Deterministic + LLM extraction
│   │       ├── ingest/       # CSV upload & processing
│   │       ├── metrics/      # Aggregated statistics
│   │       └── prisma/       # Database service
│   └── web/            # Next.js frontend
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/   # React components
│           └── lib/          # API client
├── packages/
│   └── shared/         # Shared code (enums, schemas, types)
├── docker-compose.yml  # PostgreSQL database
├── pnpm-workspace.yaml
└── package.json
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both API and Web in development mode |
| `pnpm build` | Build all packages for production |
| `pnpm test` | Run API unit tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema to database (dev) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |

## 📊 How It Works

### 1. Data Ingestion (CSV Upload)

Upload the `vambe_clients.csv` file through the dashboard:
- Click "📤 Importar CSV" button
- Drag & drop or select the CSV file
- Data is parsed and stored in the database

The CSV should have columns:
- `Nombre`, `Correo Electronico`, `Numero de Telefono`
- `Fecha de la Reunion`, `Vendedor asignado`, `closed`
- `Transcripcion` (the meeting transcript)

### 2. Extraction Pipeline

Click "🔄 Analizar Pendientes" to run extraction on all meetings. The extraction pipeline follows a robust, multi-layered architecture designed for reliability and testability:

#### Architecture Overview

The extraction process follows a **deterministic-first approach** with **LLM fallback** for maximum reliability:

```
Transcript → Regex Detection → LLM Extraction (with fallback) → Data Parsing
```

#### Step 1: Deterministic Extraction (Regex-based)

**Why deterministic first?**
- **Testability**: Regex patterns can be unit tested with 100% coverage
- **Reliability**: Deterministic results are predictable and consistent
- **Performance**: Regex is fast and doesn't require API calls
- **Cost-effective**: Reduces LLM API usage for common patterns

**Extractors:**
- `leadSourceDetector`: Identifies how the client found Vambe (LinkedIn, conference, recommendation, webinar, etc.)
- `volumeDetector`: Extracts interaction volume with units (e.g., "200 mensajes diarios", "500 interacciones semanales")
- `integrationsDetector`: Detects required system integrations (CRM, tickets, reservations, etc.)

All deterministic extractors return confidence scores and are fully unit tested.

#### Step 2: LLM Extraction with High Availability

**Dual Provider Strategy for Uptime:**
The system uses **two LLM providers** (Gemini and OpenAI) with automatic fallback to ensure high availability:

1. **Primary attempt**: Gemini API
2. **Automatic fallback**: If Gemini fails, automatically retry with OpenAI
3. **Complete logging**: Both attempts are logged for monitoring and debugging

**Benefits:**
- **99.9% uptime**: If one provider is down, the system continues operating
- **Resilience**: Handles API rate limits, timeouts, and temporary outages
- **Observability**: All API calls are logged with metadata (duration, tokens, errors)

**LLM extracts:**
- Industry classification
- Pain points identification
- Jobs-to-be-done (JTBD) extraction
- Business model detection
- Sentiment analysis
- Risk level assessment
- And other complex categorizations

#### Step 3: Result Merging

Deterministic results take **priority** over LLM results when both are available, ensuring consistency. The system merges:
- Deterministic lead sources (higher confidence)
- LLM-extracted industry, pain points, and other complex fields
- Combined integrations from both sources

#### Step 4: Data Persistence

All extraction results are:
- Validated against Zod schemas
- Stored in structured `ExtractionData` table
- Linked to API logs for full traceability

### 3. Dashboard Visualization

The dashboard shows:
- **Metrics Cards**: Total customers, closed deals, conversion rate, avg volume
- **Charts**: Lead sources, pain points, seller performance
- **Customer Table**: Filterable list with extracted categories

### 4. Filtering

Filter customers by:
- Seller
- Status (closed/open)
- Lead source
- Industry
- Date range

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest/csv` | Upload CSV file |
| POST | `/api/extract/:meetingId` | Run extraction on a meeting |
| POST | `/api/extract/bulk/all` | Extract all pending meetings |
| GET | `/api/customers` | List customers with filters |
| GET | `/api/customers/sellers` | Get unique sellers |
| GET | `/api/metrics/overview` | Aggregated metrics |
| GET | `/api/metrics/by-dim?dimension=X` | Metrics by dimension |
| GET | `/api/metrics/conversion-funnel` | Conversion funnel data |

## 🗄️ Database

### Development (PostgreSQL Local)

The project uses PostgreSQL running in Docker for local development:

**Start PostgreSQL:**
```bash
docker-compose up -d
```

**Database connection:**
- Host: `localhost`
- Port: `5433` (mapped from container's 5432)
- Database: `sales_metrics`
- User: `vambe`
- Password: `vambe_secret`

**Environment variable** (`apps/api/.env`):
```env
DATABASE_URL="postgresql://vambe:vambe_secret@localhost:5433/sales_metrics"
```

**Database commands:**
```bash
# Create database schema (push schema without migrations)
pnpm db:push

# Or use migrations (create migration files)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

**Stop PostgreSQL:**
```bash
docker-compose down
```

### Production (PostgreSQL)

For production, use PostgreSQL with Supabase or any PostgreSQL provider:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (for development)
pnpm --filter api test:watch

# Run a specific test file
pnpm --filter api test extract.service.spec.ts

# Run tests with coverage
pnpm --filter api test -- --coverage
```

### Test Structure

Following NestJS conventions, test files use the `.spec.ts` suffix and are placed alongside the source code they test. This keeps tests close to the implementation for better maintainability.

```
apps/api/src/extract/
├── deterministic/
│   ├── leadSourceDetector.ts         # Source code
│   ├── leadSourceDetector.spec.ts    # Unit tests
│   ├── volumeDetector.ts             # Source code
│   └── volumeDetector.spec.ts        # Unit tests
├── extract.service.ts                # Source code
└── extract.service.spec.ts           # Unit tests (complete extraction flow)
```

**Why `.spec.ts` alongside source?**
- NestJS standard convention (matches framework defaults)
- Tests stay close to the code they test
- Easy to find and maintain tests
- Automatically excluded from production builds

### Test Coverage

**Unit Tests (31 tests total):**

1. **Deterministic Extractors** (`leadSourceDetector.spec.ts` - 12 tests)
   - Detects lead sources: LinkedIn, Google, Conference, Recommendation, Webinar, Podcast, Trade Fair, Article
   - Handles typos and text normalization
   - Returns "unknown" for unclear transcripts
   - **100% testable**: Regex patterns are deterministic and fully testable

2. **Volume Detection** (`volumeDetector.spec.ts` - 9 tests)
   - Detects daily, weekly, and monthly interactions
   - Handles peak volumes and promotional periods
   - Parses various number formats and expressions
   - **Edge cases covered**: Handles variations in Spanish text formatting

3. **Extraction Service** (`extract.service.spec.ts` - 10 tests)
   - **Complete extraction flow**: Tests the full pipeline: regex detection → LLM call → parsing
   - **Successful Gemini extraction**: Verifies extraction when Gemini succeeds on first attempt
   - **Fallback mechanism**: Tests automatic fallback to OpenAI when Gemini fails
   - **Complete failure handling**: Tests error handling when both LLM providers fail
   - **Deterministic merge**: Verifies regex results are merged with LLM results
   - **Flow order validation**: Ensures execution follows: find meeting → regex → LLM → save → parse
   - **Logging verification**: Verifies failed attempts are logged when fallback occurs
   - **Lead source detection**: Tests conference and other lead sources from transcripts
   - **Volume detection**: Tests volume extraction from transcripts
   - **Priority handling**: Ensures deterministic results take precedence over LLM results

### Extraction Flow Testing

The `extract.service.spec.ts` tests verify the complete extraction pipeline with comprehensive coverage:

1. **Regex Detection** → Deterministic extraction runs first (leadSource, volume, integrations)
   - Fully testable with predictable inputs/outputs
   - No external dependencies required

2. **LLM Call with Fallback** → Primary attempt with Gemini, automatic fallback to OpenAI on error
   - Tests successful primary provider scenario
   - Tests fallback scenario when primary fails
   - Tests complete failure when both providers fail
   - Verifies proper error logging and metadata capture

3. **Data Parsing** → Extraction data is parsed, validated, and saved to database
   - Schema validation with Zod
   - Proper data structure persistence

All tests use mocks for external dependencies (Prisma, LLM clients) to ensure fast, isolated unit tests with no external API calls during testing.

## 🏗️ Technical Architecture & Design Decisions

### Deterministic-First Approach

**Decision**: Run regex-based extraction before LLM calls.

**Rationale**:
- **Testability**: Regex patterns can be unit tested with deterministic inputs/outputs
- **Reliability**: No external dependencies for common patterns
- **Performance**: Fast execution without API latency
- **Cost optimization**: Reduces LLM API calls for predictable data
- **Debugging**: Easier to trace and fix issues in deterministic code

### Multi-Provider LLM Strategy

**Decision**: Implement dual LLM providers (Gemini + OpenAI) with automatic fallback.

**Rationale**:
- **High Availability**: 99.9% uptime even if one provider is down
- **Resilience**: Handles rate limits, timeouts, and temporary outages gracefully
- **Vendor independence**: Not locked to a single provider
- **Cost flexibility**: Can route traffic based on pricing/performance
- **Observability**: Complete logging of all attempts for monitoring

**Implementation**:
- Primary: Gemini (faster, cost-effective)
- Fallback: OpenAI (reliable, high-quality)
- Both attempts logged with full metadata (duration, tokens, errors)
- Failed attempts preserved for debugging and analysis

### Result Merging Strategy

**Decision**: Deterministic results take priority over LLM results when both exist.

**Rationale**:
- **Consistency**: Regex patterns are more reliable for specific patterns
- **Predictability**: Deterministic results are consistent across runs
- **Quality**: Combines best of both approaches (precision + intelligence)

### Testing Strategy

**Decision**: Comprehensive unit tests with mocks for external dependencies.

**Rationale**:
- **Fast execution**: No real API calls during tests
- **Isolation**: Tests don't depend on external services
- **Coverage**: All critical paths tested (success, fallback, failure)
- **Maintainability**: Easy to update when implementation changes

## 📦 Shared Package

The `@vambe/shared` package contains:

- **Enums**: Industry, LeadSource, PainPoints, BusinessModel, etc.
- **Zod Schemas**: ExtractionSchema, CustomerSchema, etc.
- **Labels**: Spanish labels for UI display
- **Types**: TypeScript types inferred from schemas

Import in any package:
```typescript
import { LeadSource, ExtractionSchema, LeadSourceLabels } from "@vambe/shared";
```

## 🔜 Next Steps

### Improve Extraction Quality
- Add more regex patterns for edge cases
- Fine-tune industry detection
- Add sentiment analysis

### Production Deployment
1. **Frontend**: Deploy to Vercel/Netlify
2. **Backend**: Deploy to Render/Railway/Fly.io
3. **Database**: Use Supabase PostgreSQL

### Additional Features
- User authentication
- Export data to Excel/PDF
- Email notifications
- Real-time updates with WebSockets
- Historical trend charts

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://vambe:vambe_secret@localhost:5433/sales_metrics` |
| `GEMINI_API_KEY` | Google Gemini API key (Get from [Google AI Studio](https://aistudio.google.com/)) | - |
| `API_PORT` | API server port | `3001` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:3001` |

## 📄 License

MIT
