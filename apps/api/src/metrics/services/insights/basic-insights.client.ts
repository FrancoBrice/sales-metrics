import { Injectable } from "@nestjs/common";
import { InsightsClient, InsightsData, InsightsResult } from "./insights-client.interface";

@Injectable()
export class BasicInsightsClient implements InsightsClient {
  async generateInsights(data: InsightsData): Promise<InsightsResult> {
    const bottlenecks: string[] = [];
    const opportunities: string[] = [];
    const recommendations: string[] = [];

    const stage2 = data.stages.find((s) => s.name === "Qualification");
    const stage3 = data.stages.find((s) => s.name === "Needs Assessment");
    const stage4 = data.stages.find((s) => s.name === "Proposal Development");
    const stage5 = data.stages.find((s) => s.name === "Closure");

    if (stage2 && stage2.dropOffRate > 50) {
      bottlenecks.push(
        `Alta pérdida en etapa de Calificación - ${stage2.dropOffRate.toFixed(1)}% de pérdida (${data.stages[0]?.total || 0} → ${stage2.total} leads). Muchos leads no pasan la calificación inicial.`
      );
      recommendations.push(
        "Mejorar proceso de calificación y seguimiento de leads con urgencia/riesgo identificado"
      );
    }

    if (stage3 && stage3.dropOffRate > 50) {
      bottlenecks.push(
        `Alta pérdida en Análisis de Necesidades - ${stage3.dropOffRate.toFixed(1)}% de pérdida (${stage2?.total || 0} → ${stage3.total} leads). Dificultad para identificar fit del producto.`
      );
      recommendations.push(
        "Refinar preguntas de descubrimiento para identificar industria y pain points más temprano"
      );
    }

    if (stage4 && stage4.dropOffRate > 50) {
      bottlenecks.push(
        `Alta pérdida en Desarrollo de Propuesta - ${stage4.dropOffRate.toFixed(1)}% de pérdida (${stage3?.total || 0} → ${stage4.total} leads). Objeciones no resueltas.`
      );
      recommendations.push(
        "Desarrollar materiales y respuestas para objeciones comunes identificadas"
      );
    }

    const topJTBD = Object.entries(data.breakdown.byJTBD)
      .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
      .slice(0, 3);

    if (topJTBD.length > 0) {
      const jtbdList = topJTBD
        .map(([jtbd, stats]) => `${jtbd} (${stats.conversionRate.toFixed(1)}%)`)
        .join(", ");
      opportunities.push(`JTBD con mayor conversión: ${jtbdList}`);
    }

    const topIndustry = Object.entries(data.breakdown.byIndustry)
      .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
      .slice(0, 3);

    if (topIndustry.length > 0) {
      const industryList = topIndustry
        .map(([ind, stats]) => `${ind} (${stats.conversionRate.toFixed(1)}%)`)
        .join(", ");
      opportunities.push(`Industrias con mayor conversión: ${industryList}`);
    }

    if (stage5 && stage5.conversionRate < 30) {
      recommendations.push(
        `Mejorar seguimiento y cierre en etapa final - conversión actual: ${stage5.conversionRate.toFixed(1)}%. Enfocarse en métricas de éxito y sentiment positivo.`
      );
    }

    return {
      bottlenecks,
      opportunities,
      recommendations,
      metadata: {
        provider: "basic",
        model: "rules-based",
      },
    };
  }
}
