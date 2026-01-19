import { Injectable, Logger } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { PrismaService } from "../prisma/prisma.service";
import { ExtractService } from "../extract/extract.service";
import { CsvRow } from "@vambe/shared";

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractService: ExtractService
  ) { }

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
      updated: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    for (const record of records) {
      try {
        const email = record["Correo Electronico"].toLowerCase().trim();
        const meetingDate = this.parseDate(record["Fecha de la Reunion"]);
        const seller = record["Vendedor asignado"].trim();
        const closed = record.closed === "1";
        const transcript = record.Transcripcion.trim();

        const startOfDay = new Date(meetingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(meetingDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingCustomer = await this.prisma.customer.findFirst({
          where: {
            email,
            meetingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            seller,
          },
          include: {
            meetings: true,
          },
        });

        if (existingCustomer) {
          const existingMeeting = existingCustomer.meetings[0];

          if (existingMeeting) {
            if (existingMeeting.transcript === transcript) {
              results.duplicates++;
              results.processed++;
              continue;
            }

            await this.prisma.meeting.update({
              where: { id: existingMeeting.id },
              data: { transcript },
            });

            await this.prisma.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: record.Nombre,
                phone: record["Numero de Telefono"],
                closed,
              },
            });

            results.updated++;
            results.processed++;
            continue;
          }
        }

        const customer = await this.prisma.customer.create({
          data: {
            name: record.Nombre,
            email,
            phone: record["Numero de Telefono"],
            seller,
            meetingDate,
            closed,
            meetings: {
              create: {
                transcript,
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to process record ${record.Nombre}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        results.errors.push(`Error processing ${record.Nombre}: ${errorMessage}`);
        results.processed++;
      }
    }

    if (results.created > 0 || results.updated > 0) {
      this.extractService.extractAllPendingAndFailed().catch((error) => {
        this.logger.error("Failed to start extraction after CSV upload", error instanceof Error ? error.stack : undefined);
      });
    }

    return results;
  }

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
}
