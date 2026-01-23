
# Decisiones Técnicas y Arquitectura

## Decisiones de Stack Tecnológico

### Backend: NestJS + Node.js
**Decisión**: Utilizar NestJS con Node.js para el backend.

**Razones**:
- Mismo stack que utiliza Vambe
- NestJS proporciona estructura modular y escalable con decoradores e inyección de dependencias
- TypeScript nativo para type safety en todo el stack
- Arquitectura basada en módulos facilita mantenimiento y testing

**Alternativas consideradas**: Django que es el stack que utilizo en mi empresa, pero descartado para mostrar familiaridad con el stack de vambe

### Frontend: Next.js + React
**Decisión**: Utilizar Next.js con React para el frontend.

**Razones**:
- Mismo stack que utiliza Vambe
- File-based routing simplifica la estructura de rutas
- Integración nativa con React Server Components
- Familiaridad con React

### Base de Datos: PostgreSQL + Prisma
**Decisión**: PostgreSQL como base de datos relacional con Prisma como ORM.

**Razones**:
- PostgreSQL ofrece robustez y características avanzadas (JSON, arrays, índices) necesarias para analytics
- Prisma proporciona type safety end-to-end desde DB hasta código TypeScript
- Migraciones versionadas facilitan el control de cambios en el esquema
- Relaciones bien definidas para datos estructurados de clientes y extracciones

**Alternativas consideradas**: MongoDB (más flexible pero menos estructura para relaciones), SQLite pero se descartó para ser compatible con supabase más fácilmente

### Modelo LLM: DeepSeek
**Decisión**: Utilizar DeepSeek en lugar de OpenAI u otros proveedores.

**Razones**:
- API de bajo costo
- Sin rate limiting temporal
- Compatible con la API de OpenAI (mismo SDK)
- Suficiente calidad para tareas de categorización estructurada

**Alternativas consideradas**: OpenAI descartado porque no tiene capa gratuita, los resultados eran similares en pruebas así que se descartó. De todas formas integrar un nuevo proveedor es simple dada la modularidad del código, solo es necesario crear una nueva carpeta similar a la de deepseek e implementar la api, luego es directo conectarlo al flujo de extraction.

## Decisiones de Arquitectura

### Monorepo con pnpm Workspace
**Decisión**: Estructura de monorepo separando frontend y backend en apps independientes.

**Razones**:
- Desarrollo paralelo eficiente en tiempo limitado (1 semana)
- Evaluación independiente de cada componente
- Reutilización de tipos/interfaces comunes mediante `packages/shared`
- Un solo repositorio facilita el deployment y mantenimiento

**Alternativas consideradas**: Repositorios separados (más complejo para sincronización), estructura monolítica (menos modular)

## Base de Datos

### PostgreSQL con Prisma ORM
Esquema optimizado para analytics:
- `Customer`: Información básica del cliente
- `Meeting`: Transcripciones de reuniones
- `Extraction`: Resultados de análisis IA
- `ExtractionData`: Datos estructurados extraídos
- `LlmApiLog`: Logs completos de llamadas IA

### Índices UNIQUE en Relaciones 1:1
**Decisión**: Usar índices UNIQUE en `Extraction.meetingId` y `ExtractionData.extractionId` en lugar de permitir múltiples registros.

**Razones**:
- **Integridad de datos**: Índices UNIQUE garantizan relaciones 1:1 a nivel de base de datos
- **Prevención de duplicados en extracciones**: `upsert` permite re-ejecutar extracciones sin crear duplicados, facilitando reintentos automáticos
- **Performance**: Optimiza búsquedas frecuentes por `meetingId` y joins

**Implementación**: `upsert` con `where: { meetingId }` actualiza o crea según exista

**Alternativas consideradas**: Múltiples extracciones por meeting (permite historial pero no necesario para este caso)

### Prevención de Duplicados en Ingesta CSV
**Decisión**: Detectar y prevenir duplicados por combinación de email + fecha (mismo día) + vendedor durante el procesamiento de CSV, en lugar de crear registros duplicados.

**Razones**:
- **Normalización de email**: Lowercase y trim evita duplicados por diferencias de formato (ej: "Juan@Email.com" vs "juan@email.com")
- **Criterios múltiples**: Email + fecha + vendedor asegura que solo se detecte como duplicado cuando realmente lo es
- **Duplicados exactos**: Si email, fecha, vendedor y transcript son idénticos, omite para evitar procesamiento innecesario

**Alternativas consideradas**:
- Solo email (permitiría duplicados del mismo cliente en mismo día con diferente vendedor)
- Crear siempre generaría duplicados innecesarios, afectando las métricas y procesando más veces de lo necesario con llm.
- Índice UNIQUE en email (no permite múltiples reuniones del mismo cliente en diferentes días)

## Decisiones de Diseño del Sistema

### Arquitectura Híbrida: Regex Determinístico + LLM
**Decisión**: Combinar detección determinística (regex) con procesamiento LLM en lugar de usar solo LLM.

**Razones**:
- **Costo-efectividad**: Regex es gratuito y rápido para datos explícitos (lead source, volumen)
- **Precisión**: Ciertos datos aparecen explícitamente en transcripciones (ej: "500 mensajes diarios")
- **Velocidad**: Detección determinística es instantánea vs segundos de LLM
- **Control de calidad**: El regex es testeable y nos permite ser más precisos y determinísticos

**Implementación**:
- Regex detecta lead source, volumen e integraciones con umbral de confianza
- Si supera threshold (0.7), se usa directamente
- Si no supera, se pasa como hint al LLM para guiar su análisis
- Resultados determinísticos tienen prioridad sobre LLM cuando superan umbral

**Alternativas consideradas**: Solo LLM menos testeable y controlado

### Procesamiento Asíncrono con Batches
**Decisión**: Procesar extracciones en background con batches y Promise.race en lugar de sistema de colas.

**Razones**:
- **Simplicidad**: Evita complejidad de configurar RabbitMQ/Redis para un proyecto de esta escala
- **UX mejorada**: Endpoint retorna inmediatamente con estadísticas mientras procesa en background
- **Control de carga**: Límite de concurrencia (10) previene sobrecarga del sistema
- **Resiliencia**: Promise.race con timeouts evita que extracciones individuales bloqueen el proceso

**Alternativas consideradas**: Sistema de colas (RabbitMQ/Redis - demasiado complejo), procesamiento síncrono (mala UX para archivos grandes)

### Insights con IA: Carga Bajo Demanda y Datos Dinámicos
**Decisión**: Implementar insights generados por IA con carga bajo demanda (botón explícito) y datos dinámicos basados en filtros actuales, en lugar de cargar automáticamente al renderizar la página.

**Razones**:
- **Performance inicial**: Evita retrasar la carga de la página principal con llamadas costosas a LLM
- **Control de costos**: El usuario decide cuándo generar insights, evitando llamadas innecesarias a la API
- **Datos dinámicos**: Los insights se generan con los datos filtrados actuales (vendedor, rango de fechas), proporcionando análisis relevante al contexto
- **Fallback resiliente**: Si falla el LLM, usa insights básicos determinísticos para garantizar disponibilidad

**Implementación**:
- Botón "Generar Insights con IA" visible pero no ejecuta hasta que el usuario lo presiona
- Al hacer clic, envía filtros actuales al backend que genera insights con datos dinámicos
- Botón cambia a "Regenerar Insights con IA" después de la primera generación

**Alternativas consideradas**:
- Carga automática (mala UX por tiempos de espera iniciales y costos innecesarios)
- Insights estáticos (no se adaptan a filtros, menos útiles)
- Sin fallback (página se rompe si falla LLM)

### Arquitectura Modular de Integración DeepSeek
**Decisión**: Separar la integración DeepSeek en capas independientes (Client, Parser, RetryHandler, Exceptions) en lugar de un solo archivo monolítico.

**Razones**:
- **Separación de responsabilidades**: Cada componente tiene una función clara y única
- **Testeabilidad**: Componentes independientes fáciles de mockear y testear
- **Mantenibilidad**: Cambios en una capa no afectan las demás
- **Reutilización**: `RetryHandler` puede usarse en otros contextos
- **Extensibilidad**: Fácil agregar nuevos proveedores LLM siguiendo la misma estructura

**Estructura**:
- `DeepSeekClient`: Orquesta el flujo completo (HTTP, retry, error handling)
- `DeepSeekResponseParser`: Parsea y valida respuestas JSON
- `RetryHandler`: Maneja reintentos con backoff exponencial
- `DeepSeekExceptions`: Excepciones tipadas para diferentes tipos de errores

**Alternativas consideradas**: Cliente monolítico (más simple pero menos mantenible), abstracción completa de HTTP client (over-engineering para este caso)

### Enums en lugar de Texto Libre para Categorías LLM
**Decisión**: Usar enums predefinidos para todas las categorías extraídas por el LLM en lugar de permitir respuestas de texto libre.

**Razones**:
- **Consistencia en analytics**: Evita fragmentación de datos (ej: "fintech", "FinTech", "tecnología financiera" → todos `FINTECH`)
- **Validación automática**: Zod schemas validan respuestas, reduciendo errores
- **Performance**: Queries más eficientes con valores enum vs búsquedas de texto
- **UX mejorada**: Frontend puede filtrar sin búsquedas complejas de texto

**Implementación**: Prompts incluyen explícitamente valores de enum disponibles, guiando al LLM hacia opciones predefinidas.

**Alternativas consideradas**: Texto libre (más flexible pero inconsistente), categorías dinámicas (más complejo de mantener)

## Testing

### Cobertura Completa con Vitest
- **31 tests unitarios** en extractores determinísticos
- **Tests de integración** para flujo completo de extracción
- **Mocks** para dependencias externas (API de IA)

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/ingest/csv` | Subir CSV de clientes |
| `POST` | `/api/extract/bulk/all` | Extraer todos pendientes |
| `GET` | `/api/metrics/overview` | Métricas generales |
| `GET` | `/api/customers` | Listado filtrable |
| `GET` | `/api/metrics/by-dimension` | Métricas por dimensión |
| `GET` | `/api/extract/progress` | Progreso de extracciones |

## Deployment

### Frontend (Netlify)
- Build automático con `netlify.toml`
- Variables de entorno configurables
- Capa gratuita con buen rendimiento

### Backend (Koyeb)
- Despliegue directo desde GitHub
- Tier gratuito

### Base de Datos (Supabase)
- PostgreSQL
- Tier gratuito