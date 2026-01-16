You are Cursor Agent. Create a production-quality monorepo for the “Vambe AI Tech Challenge” using:
- Backend: NestJS + Prisma (typescript)
- Frontend: Next.js (TypeScript)
- Shared: a shared package for enums + Zod schema + types used by both API and Web
- Local DB: SQLite by default (zero-setup)
- Prod DB: Postgres (Supabase) via DATABASE_URL swap
- Focus: modular, clean, testable code (requirements: functionality, code quality, UX, product thinking)

NON-NEGOTIABLE REQUIREMENTS
1) Monorepo structure with clear separation:
   repo/
     apps/
       api/      (NestJS)
       web/      (Next.js)
     packages/
       shared/   (enums, zod schemas, TS types, utilities)
     docker-compose.yml (optional postgres local)
     README.md
     .env.example
2) Code must be modular:
   - Nest modules: ingest, extract, metrics, customers (or similar)
   - Each module: controller, service, dto, repository (if needed)
   - No “god services”. Keep functions small and testable.
3) Prisma:
   - Prisma schema in apps/api/prisma/schema.prisma
   - Migrations enabled
   - SQLite default DATABASE_URL=file:./dev.db
   - Scripts to run migrate/dev/generate
4) LLM extraction contract:
   - Put enums and JSON schema (Zod) in packages/shared
   - The extraction output MUST validate against Zod schema
   - Implement “repair JSON” retry hook placeholder (not full LLM yet)
5) Deterministic extraction first (regex/fuzzy) for:
   - lead_source
   - volume
   - integrations
   LLM later fills the semantic fields (pain_points, jtbd, maturity, etc.)
6) Provide step-by-step commands to run locally (single README).
7) Provide the next implementation steps checklist after scaffolding.

TECH CHOICES (use these)
- Package manager: pnpm (workspace)
- Lint/format: eslint + prettier
- Testing: vitest or jest (choose one; keep minimal but present)
- Validation: zod in shared; nest pipes use zod or class-validator where appropriate
- API docs: Swagger enabled on Nest
- UI: Next.js App Router, simple dashboard skeleton with filters placeholder

DATA MODEL (minimal tables via Prisma)
- Customer:
  id, name, email, phone, seller, meetingDate, closed (boolean), createdAt
- Meeting:
  id, customerId, transcript (text), createdAt
- Extraction:
  id, meetingId, resultJson (json), model (string), promptVersion (string),
  schemaVersion (string), status (SUCCESS|FAILED), rawModelOutput (text nullable), createdAt

ENDPOINTS (create stubs now)
API base: /api
- POST /api/ingest/csv          -> accept CSV upload, create records (stub processing)
- POST /api/extract/:meetingId  -> run deterministic extraction + LLM placeholder, save Extraction
- GET  /api/customers           -> list customers with query filters (seller, closed, date range, lead_source, pain_points)
- GET  /api/metrics/overview    -> aggregated metrics placeholder (return mock until implemented)
- GET  /api/metrics/by-dim      -> aggregated metrics by enum dim (stub)

SHARED PACKAGE CONTENT (must implement now)
packages/shared/src/
- enums.ts:
  industry, businessModel, jtbdPrimary, painPoints, leadSource, processMaturity,
  toolingMaturity, knowledgeComplexity, riskLevel, integrations, urgency,
  successMetric, objections, sentiment, volumeUnit
- schema.ts (zod):
  ExtractionSchema matching the JSON contract (the one we designed)
- labels.ts:
  mapping enum -> Spanish label for UI (e.g., LINKEDIN -> “LinkedIn”)
- index.ts exports everything

DETERMINISTIC EXTRACTOR (must implement now, in api)
- Create apps/api/src/extract/deterministic/
  - normalizeText.ts (lowercase, remove accents, trim)
  - leadSourceDetector.ts (regex + fuzzy placeholder)
  - volumeDetector.ts (regex)
  - integrationsDetector.ts (keyword mapping)
Return { lead_source, volume, integrations, confidence flags }.

LLM PLACEHOLDER (implement interface only)
- apps/api/src/extract/llm/
  - llmClient.interface.ts
  - geminiClient.placeholder.ts (returns mocked JSON matching schema)
  - jsonRepair.ts (function stub)
The service should be written so swapping to real Gemini/OpenAI call is trivial.

WEB APP (Next.js)
- Basic pages:
  - / (dashboard)
- Dashboard skeleton:
  - Filters UI (seller, closed, lead_source, date range) – wired to query params
  - Metrics cards (placeholders)
  - Table of customers with extracted categories (placeholders)
- Create a tiny API client in web to call backend endpoints.

README (must include)
- Setup: pnpm install
- Run dev: pnpm dev (runs api + web)
- DB: pnpm db:migrate, pnpm db:studio
- Environment: copy .env.example
- How to ingest CSV and view dashboard
- Architecture overview (short)
- How deterministic + LLM extraction works (short)
- Notes about SQLite dev vs Postgres (Supabase) prod

IMPLEMENTATION INSTRUCTIONS FOR YOU (Cursor)
1) Initialize pnpm workspace and configure apps + packages with TypeScript.
2) Scaffold NestJS app in apps/api with Swagger, config module, and Prisma module.
3) Scaffold Next.js app in apps/web (App Router, TS).
4) Create shared package with enums + zod schema + labels and import it from both apps.
5) Setup Prisma schema and create initial migration.
6) Implement deterministic extraction stubs and hook them into POST /api/extract/:meetingId.
7) Add ESLint + Prettier configs at root and make them apply to all packages.
8) Add minimal tests:
   - leadSourceDetector unit tests (a few typos)
   - volumeDetector unit tests
9) Ensure pnpm dev runs both apps concurrently (use turbo or concurrently).
10) Commit-ready: project runs locally without manual DB setup.

After scaffolding, output:
A) A concise list of created files/folders and important scripts.
B) Exact commands to run the project.
C) A “Next Steps” checklist to implement the real LLM call, CSV ingestion, metrics queries, and deployment (Netlify/Vercel + Render + Supabase).

Do all of the above now by generating the codebase structure and initial code.
