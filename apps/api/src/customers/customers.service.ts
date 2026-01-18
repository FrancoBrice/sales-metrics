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
  page?: number;
  limit?: number;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filter: CustomerFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

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

    // Pre-filter by extraction fields if possible
    // Note: This is an optimization. Since extraction is JSON, we fetch all for now if filtering by json fields
    // Ideally we would move critical fields to columns, but for this scale in-memory filter is fine,
    // EXCEPT pagination breaks.
    // To support proper pagination with JSON filters, we'll fetch ALL IDs first that match SQL filters,
    // then filter in memory, then paginate the result slice.

    const requiresInMemoryFilter = !!filter.leadSource || !!filter.industry;

    if (requiresInMemoryFilter) {
      // Get all matching database filters first
      const allCandidates = await this.prisma.customer.findMany({
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

      // Filter in memory
      const filtered = allCandidates.map(this.mapCustomer).filter((c) => {
        if (filter.leadSource && c.extraction?.leadSource !== filter.leadSource) return false;
        if (filter.industry && c.extraction?.industry !== filter.industry) return false;
        return true;
      });

      const total = filtered.length;
      const paginatedData = filtered.slice(skip, skip + limit);

      return {
        data: paginatedData,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

    } else {
      // Database level pagination
      const [total, customers] = await Promise.all([
        this.prisma.customer.count({ where }),
        this.prisma.customer.findMany({
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
          skip,
          take: limit,
        }),
      ]);

      return {
        data: customers.map(this.mapCustomer),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  }

  async getUniqueSellers() {
    const customers = await this.prisma.customer.findMany({
      select: { seller: true },
      distinct: ["seller"],
      orderBy: { seller: "asc" },
    });

    return customers.map((c) => c.seller);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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
    });

    if (!customer) {
      return null;
    }

    const meeting = customer.meetings[0];
    let extraction: Extraction | null = null;

    if (meeting?.extractions[0]) {
      try {
        extraction = JSON.parse(meeting.extractions[0].resultJson);
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
      transcript: meeting?.transcript ?? null,
      extraction,
    };
  }

  private mapCustomer(customer: any) {
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
  }
}
