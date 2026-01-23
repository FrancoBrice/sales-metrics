
# Decisiones Técnicas y Arquitectura

## Tecnologías Elegidas

### Stack Principal
- **Backend**: NestJS con Node.js (mismo stack que utiliza Vambe)
- **Frontend**: Next.js con React (mismo stack que utiliza Vambe)
- **Base de Datos**: PostgreSQL relacional
- **ORM**: Prisma para consultas tipo objeto
- **Gestor de Paquetes**: pnpm con workspace para monorepo
- **Testing**: Vitest para tests unitarios rápidos
- **TypeScript**: En todo el stack para type safety

### IA y Procesamiento
- **Modelo LLM**: DeepSeek (API de bajo costo, sin rate limiting)
- **Arquitectura Híbrida**: Regex determinístico + LLM para máxima precisión y costo-efectividad
- **Procesamiento**: Promise.race con batches para concurrencia controlada

## Estructura del Proyecto

### Monorepo
Se decidió utilizar una estructura de monorepo separado en dos apps para esta prueba técnica, permitiendo:
- Demostrar habilidades full-stack diferenciadas
- Desarrollo paralelo eficiente en tiempo limitado
- Evaluación independiente de cada componente
- Reutilización de tipos/interfaces comunes mediante pnpm workspace

### Organización de Código
- **apps/**: Código fuente de aplicaciones
  - **api/**: Backend NestJS para procesamiento LLM
  - **web/**: Frontend Next.js para visualización
- **packages/shared/**: Tipos, enums, schemas compartidos
- **docs/**: Documentación completa del proyecto

## Base de Datos

### PostgreSQL con Prisma ORM
Esquema optimizado para analytics:
- `Customer`: Información básica del cliente
- `Meeting`: Transcripciones de reuniones
- `Extraction`: Resultados de análisis IA
- `ExtractionData`: Datos estructurados extraídos
- `LlmApiLog`: Logs completos de llamadas IA

### Índices
Se definieron índices UNIQUE en relaciones 1:1 para optimizar consultas:
- `Extraction.meetingId`: UNIQUE - Una extraction por meeting, optimiza búsquedas por meetingId
- `ExtractionData.extractionId`: UNIQUE - Una ExtractionData por Extraction, optimiza joins

## Sistema de Extracción IA

### Arquitectura Híbrida Determinística + LLM

Se implementó un sistema de dos etapas: primero se ejecutan funciones determinísticas que buscan patrones específicos en las transcripciones para detectar lead source, volumen e integraciones mediante expresiones regulares y mapeos de palabras clave. Estos resultados se pasan como hints al LLM para guiar su análisis.

**Sistema de confianza:**
- **Threshold mínimo**: 0.7 (70% de confianza requerida para usar resultado determinístico)
- Si el resultado determinístico supera el threshold, se usa directamente
- Si no supera el threshold, se envía al LLM como hint para mejorar precisión
- Resultados determinísticos tienen prioridad sobre LLM cuando superan umbral de confianza

**Ventajas del enfoque híbrido:**
- Ciertos datos como lead source y volumen aparecen explícitamente en transcripciones
- Detección determinística es más rápida, económica y precisa
- Reduce errores de interpretación del modelo
- Optimización costo-beneficio: regex barato + LLM solo cuando necesario

### Procesamiento en Background con Batches

Las extracciones se procesan de forma asíncrona en background utilizando un sistema de batches con límite de concurrencia. Esto permite que el endpoint retorne inmediatamente con estadísticas mientras las extracciones se ejecutan en paralelo, mejorando la experiencia del usuario al evitar tiempos de espera largos.

**Decisiones técnicas:**
- Se utiliza Promise.race con timeouts para evitar que extracciones individuales bloqueen el proceso completo
- Esta decisión evita la complejidad de configurar un sistema de colas como RabbitMQ para un proyecto de esta escala
- Mantiene un control razonable sobre la carga del sistema

### Sistema de Reintentos

Se implementó un mecanismo de reintentos automáticos para extracciones fallidas, con un límite máximo configurable. El sistema identifica meetings con extracciones fallidas que aún no han alcanzado el límite de reintentos y los incluye automáticamente en el siguiente ciclo de procesamiento.

**Beneficios:**
- Mejora la resiliencia del sistema ante fallos temporales de la API del LLM
- Maneja problemas de red sin requerir intervención manual

### Tracking de Progreso

El servicio expone un endpoint de progreso que calcula estadísticas en tiempo real sobre extracciones pendientes, completadas, exitosas y fallidas. Incluye también meetings recientes procesados en las últimas 24 horas para dar contexto al usuario sobre el estado general del sistema.

**UX Benefits:**
- Permite al frontend implementar polling y mostrar barras de progreso
- Mejora la experiencia de usuario durante la carga de archivos CSV grandes

### Manejo de Errores y Logging

Todas las llamadas al LLM se registran en una tabla separada (LlmApiLog) que almacena metadatos como proveedor, modelo utilizado, tokens consumidos, duración y respuestas completas.

**Beneficios:**
- Facilita el debugging y el análisis de costos
- Los errores se capturan y se almacenan como extracciones con estado FAILED
- El sistema continúa procesando otros meetings incluso cuando algunos fallan

## Deployment

### Frontend (Netlify)
- Build automático con `netlify.toml`
- Variables de entorno configurables
- Capa gratuita con buen rendimiento

### Backend (Koyeb)
- Despliegue directo desde GitHub
- Tier gratuito suficiente para la demo

### Base de Datos (Supabase)
- PostgreSQL
- Tier gratuito

## Funcionalidades Detalladas

### Sistema de Extracción IA

#### Extracción Determinística (Regex)
- **Fuentes de leads**: LinkedIn, conferencias, recomendaciones
- **Volumen de interacciones**: mensajes/día, interacciones/semana (con threshold de confianza)
- **Integraciones requeridas**: CRM, tickets, reservas

**Nota**: Cuando el regex no alcanza el threshold de confianza (70%), el LLM actúa como fallback para extraer el volumen.

#### Extracción LLM (DeepSeek)
- **Clasificación industrial**: Automática por sector (Industry enum)
- **Modelo de negocio**: Estructura y enfoque del cliente (BusinessModel enum)
- **JTBD (Jobs To Be Done)**: Funciones principales que necesita el cliente (array)
- **Pain Points**: Problemas específicos que enfrenta el cliente (array)
- **Madurez de proceso**: Nivel de madurez de sus procesos actuales (ProcessMaturity enum)
- **Madurez tecnológica**: Nivel de herramientas y tecnología utilizadas (ToolingMaturity enum)
- **Complejidad del conocimiento**: Nivel de expertise requerido (KnowledgeComplexity enum)
- **Nivel de riesgo**: Evaluación de riesgos para el cierre (RiskLevel enum)
- **Urgencia**: Nivel de urgencia del prospect (Urgency enum)
- **Métricas de éxito**: KPIs y objetivos del cliente (array)
- **Objeciones**: Preocupaciones y barreras identificadas (array)
- **Análisis de sentimiento**: Actitud del prospect durante la reunión (Sentiment enum)
- **Volumen de negocio**: Cantidad y unidad de negocio involucrado (cuando regex no alcanza threshold)

## Uso de Enums en LLM para Control de Respuestas

### Arquitectura de Enums Estructurados
Se implementó un sistema de enums predefinidos para todas las categorías extraídas por el LLM, en lugar de permitir respuestas libres de texto. Esta decisión se basa en múltiples beneficios estratégicos:

### Beneficios del Approach con Enums

#### 1. **Agrupación Automática de Categorías**
Los enums permiten categorizar automáticamente respuestas similares bajo un mismo valor estándar, evitando la fragmentación de datos que ocurre con respuestas de texto libre.

**Ejemplo**: Un LLM podría responder "tecnología financiera", "fintech", "servicios financieros tecnológicos" o "empresa de pagos digitales" - con enums todas estas variaciones se mapean al enum `FINTECH`.

#### 2. **Consistencia en Analytics**
- **Reporting uniforme**: Todas las métricas usan las mismas categorías predefinidas
- **Comparabilidad**: Datos históricos y nuevos siguen la misma taxonomía
- **Dashboard confiable**: Visualizaciones no se rompen por variaciones de texto

#### 3. **Control de Calidad de Respuestas**
- **Respuestas estructuradas**: El LLM debe elegir de una lista predefinida, reduciendo ambigüedad
- **Validación automática**: Zod schemas validan que las respuestas pertenezcan a enums válidos
- **Menos errores de interpretación**: No hay riesgo de typos o variaciones creativas

#### 4. **Mejor Procesamiento y Performance**
- **Búsqueda optimizada**: Queries de base de datos más eficientes con valores enum
- **Filtrado rápido**: Frontend puede filtrar sin complejas búsquedas de texto

### Implementación Técnica

#### Enums Definidos
```typescript
enum Industry { FINTECH, HEALTHCARE, ECOMMERCE, /* ... */ }
enum PainPoints { SCALABILITY, INTEGRATION, COMPLIANCE, /* ... */ }
enum BusinessModel { B2B_SAAS, MARKETPLACE, SUBSCRIPTION, /* ... */ }
// ... más enums para todas las dimensiones
```

#### Prompt Engineering con Enums
Los prompts al LLM incluyen explícitamente los valores de enum disponibles, guiando la selección hacia opciones predefinidas:

```
Clasifica la industria del cliente en una de estas categorías:
- FINTECH: Servicios financieros tecnológicos
- HEALTHCARE: Servicios médicos y salud
- ECOMMERCE: Comercio electrónico
- ...

Responde ÚNICAMENTE con el nombre del enum (ej: FINTECH)
```

### Filtrado Avanzado
- **Dimensiones**: Vendedor, estado (abierto/cerrado), fuente de leads, industria, rango de fechas
- **Componente**: Reutilizable en múltiples páginas del frontend

## Testing

### Cobertura Completa con Vitest
- **31 tests unitarios** en extractores determinísticos
- **Tests de integración** para flujo completo de extracción
- **Mocks** para dependencias externas (API de IA)

### Arquitectura de Testing
- **Unit Tests**: Funciones individuales de extracción
- **Integration Tests**: Flujo completo desde CSV hasta métricas
- **Coverage**: Métricas de cobertura automática

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/ingest/csv` | Subir CSV de clientes |
| `POST` | `/api/extract/bulk/all` | Extraer todos pendientes |
| `GET` | `/api/metrics/overview` | Métricas generales |
| `GET` | `/api/customers` | Listado filtrable |
| `GET` | `/api/metrics/by-dimension` | Métricas por dimensión |
| `GET` | `/api/extract/progress` | Progreso de extracciones |


## Decisiones de Diseño

### Frontend
- **Reutilización de componentes**: Se priorizó el desarrollo de componentes reutilizables siguiendo buenas prácticas de React (Tooltip, Modal, Button, Card, etc.)
- **Vista desktop first**: Dashboard administrativo diseñado para desktop
- **Mobile**: No implementado completamente por limiación de tiempo(priorización de desktop)

### Backend
- **Cliente IA modularizado**: Fácil incorporación de nuevos proveedores (OpenAI, Gemini)
- **Uptime considerations**: Opción evaluada de múltiples proveedores pero descartada por alcance del proyecto
- **Prompts modulares**: Estructurados para mejor mantenibilidad
- **Promise.race**: Para concurrencia controlada sin sistema de colas complejo

### Configuración
- **TypeScript**: Paths absolutos para imports limpios
- **ESLint + Prettier**: Consistencia de código
- **Pnpm workspace**: Desarrollo paralelo eficiente

## Servicio de Extracción

El servicio de extracción implementa un enfoque híbrido que combina detección determinística con procesamiento mediante LLM para optimizar precisión y costo.

### Enfoque Híbrido Determinístico + LLM

Se implementó un sistema de dos etapas: primero se ejecutan funciones determinísticas que buscan patrones específicos en las transcripciones para detectar lead source, volumen e integraciones mediante expresiones regulares y mapeos de palabras clave. Estos resultados se pasan como hints al LLM para guiar su análisis. La decisión de usar este enfoque se basa en que ciertos datos como el lead source y el volumen suelen aparecer de forma explícita en las transcripciones, por lo que la detección determinística es más rápida, económica y precisa que delegar todo al LLM. Los resultados determinísticos tienen prioridad sobre los del LLM cuando superan un umbral de confianza mínimo, reduciendo errores de interpretación del modelo.

### Procesamiento en Background con Batches

Las extracciones se procesan de forma asíncrona en background utilizando un sistema de batches con límite de concurrencia. Esto permite que el endpoint retorne inmediatamente con estadísticas mientras las extracciones se ejecutan en paralelo, mejorando la experiencia del usuario al evitar tiempos de espera largos. Se utiliza Promise.race con timeouts para evitar que extracciones individuales bloqueen el proceso completo. Esta decisión evita la complejidad de configurar un sistema de colas como RabbitMQ para un proyecto de esta escala, mientras mantiene un control razonable sobre la carga del sistema.

### Sistema de Reintentos

Se implementó un mecanismo de reintentos automáticos para extracciones fallidas, con un límite máximo configurable. El sistema identifica meetings con extracciones fallidas que aún no han alcanzado el límite de reintentos y los incluye automáticamente en el siguiente ciclo de procesamiento. Esto mejora la resiliencia del sistema ante fallos temporales de la API del LLM o problemas de red, sin requerir intervención manual.

### Tracking de Progreso

El servicio expone un endpoint de progreso que calcula estadísticas en tiempo real sobre extracciones pendientes, completadas, exitosas y fallidas. Incluye también meetings recientes procesados en las últimas 24 horas para dar contexto al usuario sobre el estado general del sistema. Esta funcionalidad permite al frontend implementar polling y mostrar barras de progreso, mejorando la experiencia de usuario durante la carga de archivos CSV grandes.

### Manejo de Errores y Logging

Todas las llamadas al LLM se registran en una tabla separada (LlmApiLog) que almacena metadatos como proveedor, modelo utilizado, tokens consumidos, duración y respuestas completas. Esto facilita el debugging y el análisis de costos. Los errores se capturan y se almacenan como extracciones con estado FAILED, permitiendo que el sistema continúe procesando otros meetings incluso cuando algunos fallan, en lugar de detener todo el proceso.