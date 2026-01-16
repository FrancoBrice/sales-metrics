# Vambe Sales Metrics

Panel interactivo para análisis de métricas de clientes basado en transcripciones de reuniones de ventas, con extracción automática de categorías mediante LLM.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

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
├── docker-compose.yml  # Optional PostgreSQL
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

Click "🔄 Analizar Pendientes" to run extraction on all meetings:

**Deterministic Extractors** (regex + fuzzy matching):
- `leadSourceDetector`: Identifies how the client found Vambe (LinkedIn, conference, recommendation, etc.)
- `volumeDetector`: Extracts interaction volume (e.g., "200 mensajes diarios")
- `integrationsDetector`: Detects required system integrations (CRM, tickets, etc.)

**LLM Placeholder** (heuristic-based, ready for real LLM):
- Industry classification
- Pain points identification
- Jobs-to-be-done (JTBD) extraction
- Business model detection

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

### Development (SQLite)
By default, uses SQLite for zero-setup development:
```env
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL)
For production, use PostgreSQL with Supabase:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

Or run PostgreSQL locally with Docker:
```bash
docker-compose up -d
```

Then update `.env`:
```env
DATABASE_URL="postgresql://vambe:vambe_secret@localhost:5432/sales_metrics"
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter api test:watch
```

Unit tests cover:
- `leadSourceDetector`: Various lead source patterns and typos
- `volumeDetector`: Different volume expressions and units

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
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `GEMINI_API_KEY` | Google Gemini API key (Get from [Google AI Studio](https://aistudio.google.com/)) | - |
| `API_PORT` | API server port | `3001` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:3001` |

## 📄 License

MIT
