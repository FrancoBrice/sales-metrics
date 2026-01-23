# Guía de Gráficos - Vambe Sales Analytics

## Propósito General

Los gráficos en Vambe están diseñados para transformar datos crudos de transcripciones en insights accionables para el equipo de ventas. Cada visualización responde a preguntas específicas del negocio y ayuda a identificar patrones, oportunidades y riesgos.

## 1. Dashboard
**Ubicación**: `/` (página principal)

### Utilidad
- Vista general de métricas principales del negocio

### Por qué este gráfico
Es el punto de entrada principal donde se cargan los datos csv

## 2. Leads
**Ubicación**: `/leads`

### Utilidad
- Identifica tendencias estacionales en generación de leads
- Mide efectividad de campañas por periodo

### Por qué este gráfico
Ayuda a ver impacto de campañas comerciales por fuente, ya que nos permite ver el volumen de leads en el tiempo
## 3. Clientes
**Ubicación**: `/customers`

### Utilidad
- Lista completa de clientes con filtros avanzados
- Vista detallada de cada cliente con métricas extraídas
- Seguimiento del estado de cada oportunidad

### Por qué este gráfico
Es la vista centralizada donde se puede revisar toda la información de clientes de manera organizada y filtrable. Permite ver detalle del cliente presionando.

## 4. Vendedores
**Ubicación**: `/sellers`

### Utilidad
- Compara performance entre vendedores
- Identifica mejores prácticas y áreas de mejora

### Por qué este gráfico
Permite ver un ranking y un perfil detallado de los vendedores al presionarlos

## 5. Oportunidades
**Ubicación**: `/opportunities`

### Utilidad
- Identifica oportunidades de crecimiento cruzando volumen de interacciones con tasa de conversión
- Prioriza clientes según su potencial de negocio
- Detecta segmentos subexplotados con alto volumen pero baja conversión

### Por qué este gráfico
Los vendedores necesitan saber dónde enfocar esfuerzos. Esta matriz responde "¿Qué clientes merecen más atención?" segmentando por volumen de negocio vs. efectividad actual.

## 6. Probabilidad
**Ubicación**: `/win-probability`

### Utilidad
- Matriz **Urgencia × Sentimiento**: filas = urgencia del lead (Baja, Media, Alta, Inmediata), columnas = sentimiento (Escéptico, Neutral, Positivo), extraídos del LLM sobre las transcripciones
- Calcula **probabilidad de cierre** por celda usando conversión histórica real, ponderada por **nivel de riesgo** (Alto, Medio, Bajo) también extraído del LLM
- **Color** = probabilidad (rojo bajo, amarillo medio, verde alto); **tamaño de celda** = volumen de leads en ese segmento
- Incluye estadísticas agregadas por urgencia y por sentimiento, y leyenda de rangos de probabilidad

### Por qué este gráfico
La matriz responde a que combinación urgencia/sentimiento conviene invertir tiempo. Las celdas verdes y grandes son prioridad; las rojas y pequeñas, candidatas a despriorizar. Mejora priorización con datos extraídos de conversaciones reales.

## 7. Análisis de Cierres
**Ubicación**: `/closure-analysis`

### Utilidad
- **Análisis de cierres por categoría** en **8 dimensiones** (tabs): Fuente de Lead, Industria, JTBD, Pain Point, Vendedor, Madurez Herramientas, Complejidad, Métricas de Éxito. Datos extraídos del LLM sobre transcripciones más cierres reales.
- Gráfico de **barras por categoría**: largo = total de leads, parte coloreada = cerrados, gris = no cerrados. **Color** = rendimiento vs promedio global (excelente / bueno / neutral / atención / bajo). Línea vertical = promedio de cierres. Ordenar por **Total** o por **Tasa de conversión**.
- **Insights con IA**: botón "Generar Insights con IA" produce **Cuellos de botella**, **Oportunidades** y **Recomendaciones** en lenguaje natural. Incluye **Hallazgos estadísticos significativos** (categoría, dimensión, nivel de significancia, razonamiento). La IA usa stages del funnel, breakdown por dimensiones, top/under performers y análisis de closure.
- Resumen automático **Top Performers** (mejores categorías por conversión) y métricas globales (total, cerrados, promedio de cierres). Filtros por vendedor y rango de fechas.

### Por qué este gráfico
Responde "¿En qué categorías cerramos mejor o peor?" en múltiples ejes (industria, JTBD, pain points, etc.). Los insights con IA traducen esos datos en acciones concretas (cuellos de botella, oportunidades, recomendaciones) y en hallazgos estadísticos para priorizar dónde actuar.


## 8. Industrias
**Ubicación**: `/industries`

### Utilidad
- Mapea problemas por sector para crear propuestas específicas
- Identifica tendencias del mercado y necesidades emergentes
- Personaliza messaging según industria y dolores específicos

### Por qué este gráfico
Cada industria tiene problemas únicos. Este heatmap ayuda a "hablar el idioma" del cliente mostrando exactamente qué duele en cada sector.

## 9. Flujo de Conversión
**Ubicación**: `/conversion-flow`

### Utilidad
- Visualiza el journey del cliente desde contacto hasta cierre
- Identifica cuellos de botella en el proceso de ventas

### Por qué este gráfico
Este gráfico intenta replicar la lógica de un embudo de ventas, haciendo relaciones entre distintos parámetros para generar un flujo hasta las conversiones.
En este caso la relación no es del todo directa ya que no tenemos etapas definidas de un proceso de venta donde podamos definir un flujo real, pero la idea es mostrar la comprensión del proceso de filtrado que se produce en la vida real en los embudos de ventas a medida que vamos aplicando filtros en las leads.


## 10. Pain Points
**Ubicación**: `/pain-points`

### Utilidad
- Mapea problemas más comunes por frecuencia e intensidad

### Por qué este gráfico
Los clientes compran para eliminar dolores. Este análisis cuantifica qué duele más para enfocar esfuerzos de marketing y producto.
