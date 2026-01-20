import { InsightsData } from "../insights-client.interface";

export function buildInsightsPrompt(data: InsightsData): string {
  const stagesSection = buildStagesSection(data.stages);
  const breakdownSection = buildBreakdownSection(data.breakdown);
  const trendsSection = data.trends ? buildTrendsSection(data.trends.conversionTrend) : "";
  const statisticalSection = data.statisticalAnalysis ? buildStatisticalSection(data.statisticalAnalysis, data.overallMetrics) : "";

  return `Eres un analista de ventas experto especializado en análisis de embudos de ventas B2B SaaS.
Analiza los siguientes datos del embudo de ventas y genera insights accionables en español.

=== DATOS DEL EMBUDO ===

${stagesSection}

${breakdownSection}

${trendsSection}

${statisticalSection}

=== INSTRUCCIONES ===

Analiza estos datos y genera insights en formato JSON con tres categorías:

1. BOTTLENECKS (Cuellos de Botella):
   - Identifica etapas con alta pérdida (dropOffRate > 50%)
   - Incluye números específicos y contexto
   - Explica el impacto en el negocio
   - Máximo 3 bottlenecks más críticos

2. OPPORTUNITIES (Oportunidades):
   - Identifica patrones de alto rendimiento
   - Destaca dimensiones (JTBD, Industrias, Fuentes) con mejor conversión
   - Incluye números y comparaciones
   - Máximo 3 oportunidades más valiosas

3. RECOMMENDATIONS (Recomendaciones):
   - Recomendaciones específicas y accionables
   - Priorizadas por impacto potencial
   - Incluye contexto y métricas relevantes
   - Máximo 4 recomendaciones

=== FORMATO DE SALIDA ===

Retorna SOLO un objeto JSON válido con esta estructura:
{
  "bottlenecks": ["insight 1", "insight 2", ...],
  "opportunities": ["oportunidad 1", "oportunidad 2", ...],
  "recommendations": ["recomendación 1", "recomendación 2", ...]
}

IMPORTANTE:
- Retorna ÚNICAMENTE el JSON, sin markdown, sin code blocks, sin explicaciones
- NO uses markdown code blocks para envolver el JSON
- NO agregues texto antes o después del JSON
- Todos los textos deben estar en español
- Incluye números específicos cuando sea relevante
- Sé conciso pero informativo
- Enfócate en insights accionables
- El JSON debe comenzar con { y terminar con }`;
}

function buildStagesSection(stages: InsightsData["stages"]): string {
  return stages.map((stage, index) => {
    const previousStage = index > 0 ? stages[index - 1] : null;
    const conversionFromPrevious = previousStage && previousStage.total > 0
      ? ((stage.total / previousStage.total) * 100).toFixed(1)
      : "100.0";

    return `Etapa ${index + 1}: ${stage.name}
  - Total: ${stage.total} leads
  - Cerrados: ${stage.closed} (${stage.conversionRate.toFixed(1)}% conversión)
  - Conversión desde etapa anterior: ${conversionFromPrevious}%
  - Tasa de pérdida: ${stage.dropOffRate.toFixed(1)}%`;
  }).join("\n\n");
}

function buildBreakdownSection(breakdown: InsightsData["breakdown"]): string {
  const topLeadSources = Object.entries(breakdown.byLeadSource)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([source, stats]) => `  - ${source}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% conversión`);

  const topJTBD = Object.entries(breakdown.byJTBD)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([jtbd, stats]) => `  - ${jtbd}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% conversión`);

  const topIndustries = Object.entries(breakdown.byIndustry)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([industry, stats]) => `  - ${industry}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% conversión`);

  return `=== DESGLOSE POR DIMENSIONES ===

Top Fuentes de Leads:
${topLeadSources.length > 0 ? topLeadSources.join("\n") : "  - Sin datos"}

Top JTBD (Jobs-to-be-Done):
${topJTBD.length > 0 ? topJTBD.join("\n") : "  - Sin datos"}

Top Industrias:
${topIndustries.length > 0 ? topIndustries.join("\n") : "  - Sin datos"}`;
}

function buildTrendsSection(trends: Array<{ period: string; conversionRate: number }>): string {
  if (trends.length === 0) return "";

  const trendLines = trends
    .slice(-6)
    .map(t => `  - ${t.period}: ${t.conversionRate.toFixed(1)}%`)
    .join("\n");

  const isImproving = trends.length >= 2 &&
    trends[trends.length - 1].conversionRate > trends[trends.length - 2].conversionRate;

  return `=== TENDENCIAS TEMPORALES ===

Últimos períodos:
${trendLines}

Tendencia: ${isImproving ? "Mejorando" : "Estable/Decreciendo"}`;
}

function buildStatisticalSection(
  analysis: NonNullable<InsightsData["statisticalAnalysis"]>,
  overall?: InsightsData["overallMetrics"]
): string {
  const overallRate = overall?.conversionRate || 0;

  const topPerformersText = analysis.topPerformers.length > 0
    ? analysis.topPerformers
        .map((p) => `  - ${p.category}: ${p.conversionRate.toFixed(1)}% conversión (${p.closed}/${p.total}), +${(p.conversionRate - overallRate).toFixed(1)}% vs promedio`)
        .join("\n")
    : "  - Sin datos";

  const underperformersText = analysis.underperformers.length > 0
    ? analysis.underperformers
        .map((u) => `  - ${u.category}: ${u.conversionRate.toFixed(1)}% conversión (${u.closed}/${u.total}), ${(u.conversionRate - overallRate).toFixed(1)}% vs promedio`)
        .join("\n")
    : "  - Sin datos";

  const opportunitiesText = analysis.highVolumeOpportunities.length > 0
    ? analysis.highVolumeOpportunities
        .map((o) => `  - ${o.category}: Volumen ${o.volume}, ${o.conversionRate.toFixed(1)}% conversión (${o.total} leads), potencial de mejora`)
        .join("\n")
    : "  - Sin datos";

  const significantText = analysis.significantFindings.length > 0
    ? analysis.significantFindings
        .slice(0, 5)
        .map((s) => `  - ${s.category} (${s.dimension}): ${s.significance} - ${s.reasoning}`)
        .join("\n")
    : "  - Sin datos";

  return `=== ANÁLISIS ESTADÍSTICO VERIFICADO ===

Tasa de conversión promedio: ${overallRate.toFixed(1)}%

Top Performers (estadísticamente significativos):
${topPerformersText}

Underperformers (necesitan atención):
${underperformersText}

Oportunidades de Alto Volumen:
${opportunitiesText}

Hallazgos Estadísticamente Significativos:
${significantText}

IMPORTANTE: Prioriza estos hallazgos en tus insights ya que están respaldados por análisis estadístico.`;
}
