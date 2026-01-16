import { Injectable } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { PrismaService } from "../prisma/prisma.service";
import { CsvRow } from "@vambe/shared";

@Injectable()
export class IngestService {
  constructor(private readonly prisma: PrismaService) { }

  async processCsv(buffer: Buffer) {
    const content = buffer.toString("utf-8");

    const records: CsvRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[],
    };

    for (const record of records) {
      try {
        const meetingDate = this.parseDate(record["Fecha de la Reunion"]);
        const closed = record.closed === "1";

        const customer = await this.prisma.customer.create({
          data: {
            name: record.Nombre,
            email: record["Correo Electronico"],
            phone: record["Numero de Telefono"],
            seller: record["Vendedor asignado"],
            meetingDate,
            closed,
            meetings: {
              create: {
                transcript: record.Transcripcion,
              },
            },
          },
          include: {
            meetings: true,
          },
        });

        results.created++;
        results.processed++;
      } catch (error) {
        results.errors.push(`Error processing ${record.Nombre}: ${error}`);
        results.processed++;
      }
    }

    return results;
  }

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
}
