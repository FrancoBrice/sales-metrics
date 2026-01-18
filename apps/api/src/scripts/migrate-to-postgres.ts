import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import * as path from "path";

const sqliteDbPath = path.join(__dirname, "../../prisma/dev.db.backup");
const sqliteDb = new Database(sqliteDbPath, { readonly: true });

const postgresClient = new PrismaClient();

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  meetingDate: string;
  closed: number;
  createdAt: string;
}

interface MeetingRow {
  id: string;
  customerId: string;
  transcript: string;
  createdAt: string;
}

interface ExtractionRow {
  id: string;
  meetingId: string;
  resultJson: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  status: string;
  rawModelOutput: string | null;
  createdAt: string;
}

async function migrate() {
  console.log("Iniciando migración de SQLite a PostgreSQL...");
  console.log(`Leyendo desde: ${sqliteDbPath}`);

  try {
    const customers = sqliteDb
      .prepare("SELECT * FROM Customer ORDER BY createdAt")
      .all() as CustomerRow[];

    console.log(`\n✓ Encontrados ${customers.length} customers`);

    if (customers.length === 0) {
      console.log("No hay datos para migrar.");
      return;
    }

    let migratedCustomers = 0;
    let migratedMeetings = 0;
    let migratedExtractions = 0;

    for (const customer of customers) {
      try {
        const meetings = sqliteDb
          .prepare("SELECT * FROM Meeting WHERE customerId = ? ORDER BY createdAt")
          .all(customer.id) as MeetingRow[];

        const meetingsData = meetings.map((meeting) => {
          const extractions = sqliteDb
            .prepare("SELECT * FROM Extraction WHERE meetingId = ? ORDER BY createdAt")
            .all(meeting.id) as ExtractionRow[];

          return {
            id: meeting.id,
            transcript: meeting.transcript,
            createdAt: new Date(meeting.createdAt),
            extractions: {
              create: extractions.map((ext) => ({
                id: ext.id,
                resultJson: ext.resultJson,
                model: ext.model,
                promptVersion: ext.promptVersion,
                schemaVersion: ext.schemaVersion,
                status: ext.status,
                rawModelOutput: ext.rawModelOutput ?? null,
                createdAt: new Date(ext.createdAt),
              })),
            },
          };
        });

        await postgresClient.customer.create({
          data: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            seller: customer.seller,
            meetingDate: new Date(customer.meetingDate),
            closed: Boolean(customer.closed),
            createdAt: new Date(customer.createdAt),
            meetings: {
              create: meetingsData,
            },
          },
        });

        migratedCustomers++;
        migratedMeetings += meetings.length;
        migratedExtractions += meetings.reduce(
          (acc, m) =>
            acc +
            (sqliteDb
              .prepare("SELECT COUNT(*) as count FROM Extraction WHERE meetingId = ?")
              .get(m.id) as { count: number }).count,
          0
        );

        console.log(
          `  ✓ Migrado: ${customer.name} (${meetings.length} meetings, ${
            meetings.reduce(
              (acc, m) =>
                acc +
                (sqliteDb
                  .prepare("SELECT COUNT(*) as count FROM Extraction WHERE meetingId = ?")
                  .get(m.id) as { count: number }).count,
              0
            )
          } extractions)`
        );
      } catch (error) {
        console.error(`  ✗ Error migrando customer ${customer.name}:`, error);
      }
    }

    console.log(`\n✓ Migración completada:`);
    console.log(`  - Customers: ${migratedCustomers}`);
    console.log(`  - Meetings: ${migratedMeetings}`);
    console.log(`  - Extractions: ${migratedExtractions}`);
  } catch (error) {
    console.error("Error durante la migración:", error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgresClient.$disconnect();
  }
}

migrate()
  .then(() => {
    console.log("\n✓ Migración finalizada exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Error en la migración:", error);
    process.exit(1);
  });