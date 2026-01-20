import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Extraction } from "@vambe/shared";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { CustomerWithRelations } from "../../common/types";
import { buildDateFilter } from "../../common/helpers/filter.helper";
import { getExtractionFromCustomer } from "../../common/helpers/extraction.helper";

@Injectable()
export class BaseMetricsService {
  constructor(protected readonly prisma: PrismaService) {}

  protected async getCustomers(filter: MetricsFilterDto): Promise<CustomerWithRelations[]> {
    const where: Prisma.CustomerWhereInput = {};

    if (filter.seller) {
      where.seller = filter.seller;
    }

    const dateFilter = buildDateFilter({ dateFrom: filter.dateFrom, dateTo: filter.dateTo });
    if (dateFilter) {
      where.meetingDate = dateFilter;
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        meetings: {
          include: {
            extractions: {
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
  }

  protected getExtraction(customer: CustomerWithRelations): Extraction | null {
    return getExtractionFromCustomer(customer);
  }
}
