import { InsightsData } from "../insights-client.interface";

export function buildInsightsPrompt(data: InsightsData): string {
  const stagesSection = buildStagesSection(data.stages);
  const breakdownSection = buildBreakdownSection(data.breakdown);
  const trendsSection = data.trends ? buildTrendsSection(data.trends.conversionTrend) : "";
  const statisticalSection = data.statisticalAnalysis ? buildStatisticalSection(data.statisticalAnalysis, data.overallMetrics) : "";
  const urgencySentimentSection = data.urgencySentiment ? buildUrgencySentimentSection(data.urgencySentiment) : "";
  const filtersSection = data.filters ? buildFiltersSection(data.filters) : "";

  return `Eres un analista de ventas experto. Analiza los datos de conversión y genera insights accionables en español.

${filtersSection}

Datos de conversión y cierres:

${stagesSection}

${breakdownSection}

${urgencySentimentSection}

${trendsSection}

${statisticalSection}

Instrucciones:

Genera insights en formato JSON con tres categorías:

1. Cuellos de botella (máximo 3):
   - Categorías con baja conversión vs promedio
   - Incluye números, tasas y comparaciones
   - Explica impacto y causas

2. Oportunidades (máximo 3):
   - Patrones de alto rendimiento
   - Dimensiones con mejor conversión (Fuentes, Industrias, JTBD, Pain Points, Vendedores, Urgencia, Sentimiento)
   - Oportunidades de alto volumen
   - Combinaciones de urgencia/sentimiento con alta conversión

3. Recomendaciones (máximo 4):
   - Acciones específicas priorizadas por impacto
   - Cómo mejorar bajo desempeño y replicar éxitos
   - Incluye métricas relevantes

Formato de salida:

Retorna SOLO JSON válido:
{
  "bottlenecks": ["insight 1", "insight 2"],
  "opportunities": ["oportunidad 1", "oportunidad 2"],
  "recommendations": ["recomendación 1", "recomendación 2"]
}

Importante:
- Solo JSON, sin markdown ni explicaciones
- Textos en español
- Incluye números específicos
- Sé conciso y accionable`;
}

function buildStagesSection(stages: InsightsData["stages"]): string {
  if (stages.length === 0) return "";

  return stages.map((stage, index) => {
    const previousStage = index > 0 ? stages[index - 1] : null;
    const conversionFromPrevious = previousStage && previousStage.total > 0
      ? ((stage.total / previousStage.total) * 100).toFixed(1)
      : "100.0";

    return `${stage.name}: ${stage.total} leads, ${stage.closed} cerrados (${stage.conversionRate.toFixed(1)}%), conversión desde anterior: ${conversionFromPrevious}%, pérdida: ${stage.dropOffRate.toFixed(1)}%`;
  }).join("\n");
}

function buildBreakdownSection(breakdown: InsightsData["breakdown"]): string {
  const topLeadSources = Object.entries(breakdown.byLeadSource)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([source, stats]) => `  ${source}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}%`);

  const topJTBD = Object.entries(breakdown.byJTBD)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([jtbd, stats]) => `  ${jtbd}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}%`);

  const topIndustries = Object.entries(breakdown.byIndustry)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, 5)
    .map(([industry, stats]) => `  ${industry}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}%`);

  const sections: string[] = [];

  if (topLeadSources.length > 0) {
    sections.push(`Fuentes de leads:\n${topLeadSources.join("\n")}`);
  }
  if (topJTBD.length > 0) {
    sections.push(`JTBD:\n${topJTBD.join("\n")}`);
  }
  if (topIndustries.length > 0) {
    sections.push(`Industrias:\n${topIndustries.join("\n")}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}

function buildTrendsSection(trends: Array<{ period: string; conversionRate: number }>): string {
  if (trends.length === 0) return "";

  const trendLines = trends
    .slice(-6)
    .map(t => `  ${t.period}: ${t.conversionRate.toFixed(1)}%`)
    .join("\n");

  const isImproving = trends.length >= 2 &&
    trends[trends.length - 1].conversionRate > trends[trends.length - 2].conversionRate;

  return `Tendencias (últimos períodos):\n${trendLines}\nTendencia: ${isImproving ? "Mejorando" : "Estable/Decreciendo"}`;
}

function buildStatisticalSection(
  analysis: NonNullable<InsightsData["statisticalAnalysis"]>,
  overall?: InsightsData["overallMetrics"]
): string {
  const overallRate = overall?.conversionRate || 0;
  const sections: string[] = [];

  if (overallRate > 0) {
    sections.push(`Conversión promedio: ${overallRate.toFixed(1)}%`);
  }

  if (analysis.topPerformers.length > 0) {
    const performers = analysis.topPerformers
      .map((p) => `  ${p.category}: ${p.conversionRate.toFixed(1)}% (${p.closed}/${p.total}), +${(p.conversionRate - overallRate).toFixed(1)}% vs promedio`)
      .join("\n");
    sections.push(`Top performers:\n${performers}`);
  }

  if (analysis.underperformers.length > 0) {
    const underperformers = analysis.underperformers
      .map((u) => `  ${u.category}: ${u.conversionRate.toFixed(1)}% (${u.closed}/${u.total}), ${(u.conversionRate - overallRate).toFixed(1)}% vs promedio`)
      .join("\n");
    sections.push(`Bajo desempeño:\n${underperformers}`);
  }

  if (analysis.highVolumeOpportunities.length > 0) {
    const opportunities = analysis.highVolumeOpportunities
      .map((o) => `  ${o.category}: Volumen ${o.volume}, ${o.conversionRate.toFixed(1)}% (${o.total} leads)`)
      .join("\n");
    sections.push(`Oportunidades alto volumen:\n${opportunities}`);
  }

  if (analysis.significantFindings.length > 0) {
    const findings = analysis.significantFindings
      .slice(0, 5)
      .map((s) => {
        const significanceLabel = s.significance === "high" ? "alta" : s.significance === "medium" ? "media" : "baja";
        return `  ${s.category} (${s.dimension}): Significancia ${significanceLabel} - ${s.reasoning}`;
      })
      .join("\n");
    sections.push(`Hallazgos significativos:\n${findings}`);
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}

function buildUrgencySentimentSection(urgencySentiment: NonNullable<InsightsData["urgencySentiment"]>): string {
  const sections: string[] = [];

  if (Object.keys(urgencySentiment.byUrgency).length > 0) {
    const urgencyLines = Object.entries(urgencySentiment.byUrgency)
      .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
      .map(([urgency, stats]) => `  ${urgency}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% (${stats.closed}/${stats.total})`)
      .join("\n");
    sections.push(`Conversión por urgencia:\n${urgencyLines}`);
  }

  if (Object.keys(urgencySentiment.bySentiment).length > 0) {
    const sentimentLines = Object.entries(urgencySentiment.bySentiment)
      .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
      .map(([sentiment, stats]) => `  ${sentiment}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% (${stats.closed}/${stats.total})`)
      .join("\n");
    sections.push(`Conversión por sentimiento:\n${sentimentLines}`);
  }

  if (urgencySentiment.matrix.length > 0) {
    const topCombinations = urgencySentiment.matrix
      .filter(m => m.total > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5)
      .map(m => `  ${m.urgency}/${m.sentiment}: ${m.conversionRate.toFixed(1)}% (${m.closed}/${m.total})`)
      .join("\n");
    if (topCombinations) {
      sections.push(`Top combinaciones urgencia/sentimiento:\n${topCombinations}`);
    }
  }

  return sections.length > 0 ? sections.join("\n\n") : "";
}

function buildFiltersSection(filters: NonNullable<InsightsData["filters"]>): string {
  const filterParts: string[] = [];

  if (filters.seller) {
    filterParts.push(`Vendedor: ${filters.seller}`);
  }

  if (filters.dateFrom) {
    filterParts.push(`Desde: ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    filterParts.push(`Hasta: ${filters.dateTo}`);
  }

  if (filterParts.length === 0) {
    return "";
  }

  return `Filtros aplicados: ${filterParts.join(", ")}\nNota: Los insights se basan en estos datos filtrados.`;
}
