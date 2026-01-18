import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanConfidenceFromJson() {
  console.log("Limpiando campo 'confidence' de los JSONs existentes...");

  const extractions = await prisma.extraction.findMany({
    where: {
      resultJson: {
        not: "",
      },
    },
  });

  console.log(`\n✓ Encontradas ${extractions.length} extractions con JSON`);

  if (extractions.length === 0) {
    console.log("No hay extractions para limpiar.");
    return;
  }

  let cleaned = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const extraction of extractions) {
    try {
      const parsed = JSON.parse(extraction.resultJson);

      if ("confidence" in parsed) {
        delete parsed.confidence;

        await prisma.extraction.update({
          where: { id: extraction.id },
          data: {
            resultJson: JSON.stringify(parsed),
          },
        });

        cleaned++;
        if (cleaned % 10 === 0) {
          console.log(`  ✓ Limpiadas ${cleaned}/${extractions.length} extractions...`);
        }
      } else {
        cleaned++;
      }
    } catch (error) {
      failed++;
      const errorMsg = `Extraction ${extraction.id}: ${error}`;
      errors.push(errorMsg);
      console.error(`  ✗ Error en extraction ${extraction.id}:`, error);
    }
  }

  console.log(`\n✓ Limpieza completada:`);
  console.log(`  - JSONs actualizados: ${cleaned}`);
  console.log(`  - Fallidas: ${failed}`);

  if (errors.length > 0 && errors.length <= 10) {
    console.log(`\nErrores encontrados:`);
    errors.forEach((err) => console.log(`  - ${err}`));
  } else if (errors.length > 10) {
    console.log(`\nTotal de errores: ${errors.length} (mostrando solo primeros 10)`);
    errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
  }
}

cleanConfidenceFromJson()
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