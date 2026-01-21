import { Injectable, Logger } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { PrismaService } from "../prisma/prisma.service";
import { CsvRow } from "@vambe/shared";
import { getDateRange } from "../common/helpers/date.helper";

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly prisma: PrismaService
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
        if (!this.isValidRecord(record)) {
          results.errors.push(`Invalid record: missing required fields`);
          results.processed++;
          continue;
        }

        const email = record["Correo Electronico"].toLowerCase().trim();
        const meetingDate = this.parseDate(record["Fecha de la Reunion"]);
        if (!meetingDate || isNaN(meetingDate.getTime())) {
          results.errors.push(`Invalid date format in record: ${record.Nombre || "unknown"}`);
          results.processed++;
          continue;
        }

        const seller = record["Vendedor asignado"].trim();
        const closed = record.closed === "1";
        const transcript = record.Transcripcion.trim();

        const { startOfDay, endOfDay } = getDateRange(meetingDate);

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

            await Promise.all([
              this.prisma.meeting.update({
                where: { id: existingMeeting.id },
                data: { transcript },
              }),
              this.prisma.customer.update({
                where: { id: existingCustomer.id },
                data: {
                  name: record.Nombre,
                  phone: record["Numero de Telefono"],
                  closed,
                },
              }),
            ]);

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
        const recordName = record?.Nombre || "unknown";
        this.logger.error(`Failed to process record ${recordName}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
        results.errors.push(`Error processing ${recordName}: ${errorMessage}`);
        results.processed++;
      }
    }

    return results;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== "string") {
      return null;
    }

    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      return null;
    }

    const [year, month, day] = parts.map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private isValidRecord(record: CsvRow): boolean {
    return !!(
      record["Correo Electronico"] &&
      record["Fecha de la Reunion"] &&
      record["Vendedor asignado"] &&
      record.Transcripcion &&
      record.Nombre &&
      record["Numero de Telefono"] !== undefined
    );
  }
}
