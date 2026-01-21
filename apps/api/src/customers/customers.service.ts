import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { ListCustomersDto } from "./dto/list-customers.dto";
import { CustomerWithRelations, CustomerMapped, CustomerDetailMapped } from "../common/types";
import { buildDateFilter } from "../common/helpers/filter.helper";
import { getExtractionFromCustomer } from "../common/helpers/extraction.helper";
import { formatDateToISO } from "../common/helpers/date.helper";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../common/constants";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filter: ListCustomersDto) {
    const page = filter.page ?? DEFAULT_PAGE;
    const limit = filter.limit ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (filter.seller) {
      where.seller = filter.seller;
    }

    if (filter.closed !== undefined) {
      where.closed = filter.closed;
    }

    if (filter.search) {
      where.name = {
        contains: filter.search,
        mode: "insensitive" as Prisma.QueryMode,
      };
    }

    const dateFilter = buildDateFilter({ dateFrom: filter.dateFrom, dateTo: filter.dateTo });
    if (dateFilter) {
      where.meetingDate = dateFilter;
    }

    const requiresInMemoryFilter = !!filter.leadSource || !!filter.industry;

    if (requiresInMemoryFilter) {
      const allCandidates = await this.findCustomersWithExtractions(where);

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
      const [total, customers] = await Promise.all([
        this.prisma.customer.count({ where }),
        this.findCustomersWithExtractions(where, skip, limit),
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

  async findOne(id: string): Promise<CustomerDetailMapped> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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

    if (!customer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    const meeting = customer.meetings[0];
    const extraction = getExtractionFromCustomer(customer);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      seller: customer.seller,
      meetingDate: formatDateToISO(customer.meetingDate),
      closed: customer.closed,
      createdAt: customer.createdAt.toISOString(),
      meetingId: meeting?.id ?? null,
      transcript: meeting?.transcript ?? null,
      extraction,
    };
  }

  private mapCustomer(customer: CustomerWithRelations): CustomerMapped {
    const meeting = customer.meetings[0];
    const extraction = getExtractionFromCustomer(customer);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      seller: customer.seller,
      meetingDate: formatDateToISO(customer.meetingDate),
      closed: customer.closed,
      createdAt: customer.createdAt.toISOString(),
      meetingId: meeting?.id ?? null,
      extraction,
    };
  }

  private async findCustomersWithExtractions(
    where: Prisma.CustomerWhereInput,
    skip?: number,
    take?: number
  ): Promise<CustomerWithRelations[]> {
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
      orderBy: { meetingDate: "desc" },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });
  }
}
