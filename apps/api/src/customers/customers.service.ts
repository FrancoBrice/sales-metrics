import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Extraction } from "@vambe/shared";

interface CustomerFilter {
  seller?: string;
  closed?: boolean;
  leadSource?: string;
  dateFrom?: string;
  dateTo?: string;
  industry?: string;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filter: CustomerFilter) {
    const where: Prisma.CustomerWhereInput = {};

    if (filter.seller) {
      where.seller = filter.seller;
    }

    if (filter.closed !== undefined) {
      where.closed = filter.closed;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.meetingDate = {};
      if (filter.dateFrom) {
        where.meetingDate.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.meetingDate.lte = new Date(filter.dateTo);
      }
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        meetings: {
          include: {
            extractions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { meetingDate: "desc" },
    });

    const result = customers.map((customer) => {
      const meeting = customer.meetings[0];
      const extractionRecord = meeting?.extractions[0];

      let extraction: Extraction | null = null;
      if (extractionRecord) {
        try {
          extraction = JSON.parse(extractionRecord.resultJson);
        } catch {
          extraction = null;
        }
      }

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        seller: customer.seller,
        meetingDate: customer.meetingDate.toISOString().split("T")[0],
        closed: customer.closed,
        createdAt: customer.createdAt.toISOString(),
        meetingId: meeting?.id ?? null,
        extraction,
      };
    });

    if (filter.leadSource) {
      return result.filter(
        (c) => c.extraction?.leadSource === filter.leadSource
      );
    }

    if (filter.industry) {
      return result.filter(
        (c) => c.extraction?.industry === filter.industry
      );
    }

    return result;
  }

  async getUniqueSellers() {
    const customers = await this.prisma.customer.findMany({
      select: { seller: true },
      distinct: ["seller"],
      orderBy: { seller: "asc" },
    });

    return customers.map((c) => c.seller);
  }
}
