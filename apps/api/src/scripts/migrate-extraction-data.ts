import { PrismaClient } from "@prisma/client";
import { ExtractionSchema, Extraction } from "@vambe/shared";

const prisma = new PrismaClient();

async function parseAndSaveExtractionData(extractionId: string, extraction: Extraction): Promise<void> {
  await prisma.extractionData.upsert({
    where: { extractionId },
    create: {
      extractionId,
      industry: extraction.industry ?? null,
      businessModel: extraction.businessModel ?? null,
      jtbdPrimary: extraction.jtbdPrimary ?? [],
      painPoints: extraction.painPoints ?? [],
      leadSource: extraction.leadSource ?? null,
      processMaturity: extraction.processMaturity ?? null,
      toolingMaturity: extraction.toolingMaturity ?? null,
      knowledgeComplexity: extraction.knowledgeComplexity ?? null,
      riskLevel: extraction.riskLevel ?? null,
      integrations: extraction.integrations ?? [],
      urgency: extraction.urgency ?? null,
      successMetrics: extraction.successMetrics ?? [],
      objections: extraction.objections ?? [],
      sentiment: extraction.sentiment ?? null,
        volumeQuantity: extraction.volume?.quantity ?? null,
        volumeUnit: extraction.volume?.unit ?? null,
        volumeIsPeak: extraction.volume?.isPeak ?? false,
      },
    update: {
      industry: extraction.industry ?? null,
      businessModel: extraction.businessModel ?? null,
      jtbdPrimary: extraction.jtbdPrimary ?? [],
      painPoints: extraction.painPoints ?? [],
      leadSource: extraction.leadSource ?? null,
      processMaturity: extraction.processMaturity ?? null,
      toolingMaturity: extraction.toolingMaturity ?? null,
      knowledgeComplexity: extraction.knowledgeComplexity ?? null,
      riskLevel: extraction.riskLevel ?? null,
      integrations: extraction.integrations ?? [],
      urgency: extraction.urgency ?? null,
      successMetrics: extraction.successMetrics ?? [],
      objections: extraction.objections ?? [],
      sentiment: extraction.sentiment ?? null,
        volumeQuantity: extraction.volume?.quantity ?? null,
        volumeUnit: extraction.volume?.unit ?? null,
        volumeIsPeak: extraction.volume?.isPeak ?? false,
      },
  });
}

async function migrateExtractionData() {
  console.log("Iniciando migración de datos de Extraction a ExtractionData...");

  const extractions = await prisma.extraction.findMany({
    where: {
      status: "SUCCESS",
      data: null,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n✓ Encontradas ${extractions.length} extractions sin datos estructurados`);

  if (extractions.length === 0) {
    console.log("No hay extractions para migrar.");
    return;
  }

  let migrated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const extraction of extractions) {
    try {
      const apiLog = await prisma.llmApiLog.findFirst({
        where: {
          extractionId: extraction.id,
          status: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!apiLog || !apiLog.response) {
        failed++;
        const errorMsg = `Extraction ${extraction.id}: No se encontró respuesta de API para migrar`;
        errors.push(errorMsg);
        console.warn(`  ⚠ Extraction ${extraction.id}: Sin datos de API para migrar`);
        continue;
      }

      const responseData = JSON.parse(apiLog.response);
      const content = responseData.content || responseData.text || "";

      if (!content) {
        failed++;
        const errorMsg = `Extraction ${extraction.id}: Respuesta de API vacía`;
        errors.push(errorMsg);
        console.warn(`  ⚠ Extraction ${extraction.id}: Respuesta de API vacía`);
        continue;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        failed++;
        const errorMsg = `Extraction ${extraction.id}: No se encontró JSON válido en la respuesta`;
        errors.push(errorMsg);
        console.warn(`  ⚠ Extraction ${extraction.id}: No se encontró JSON válido`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.volume?.unit === "SEMANA") {
        parsed.volume.unit = "SEMANAL";
      }

      const validated = ExtractionSchema.parse(parsed);

      await parseAndSaveExtractionData(extraction.id, validated);

      migrated++;
      if (migrated % 10 === 0) {
        console.log(`  ✓ Migradas ${migrated}/${extractions.length} extractions...`);
      }
    } catch (error) {
      failed++;
      const errorMsg = `Extraction ${extraction.id}: ${error}`;
      errors.push(errorMsg);
      console.error(`  ✗ Error en extraction ${extraction.id}:`, error);
    }
  }

  console.log(`\n✓ Migración completada:`);
  console.log(`  - Migradas exitosamente: ${migrated}`);
  console.log(`  - Fallidas: ${failed}`);

  if (errors.length > 0 && errors.length <= 10) {
    console.log(`\nErrores encontrados:`);
    errors.forEach((err) => console.log(`  - ${err}`));
  } else if (errors.length > 10) {
    console.log(`\nTotal de errores: ${errors.length} (mostrando solo primeros 10)`);
    errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
  }
}

migrateExtractionData()
  .then(() => {
    console.log("\n✓ Script finalizado exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Error en el script:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });