import { Prisma } from "@prisma/client";

export interface DateFilter {
  dateFrom?: string;
  dateTo?: string;
}

export function buildDateFilter(dateFilter?: DateFilter): Prisma.DateTimeFilter | undefined {
  if (!dateFilter?.dateFrom && !dateFilter?.dateTo) {
    return undefined;
  }

  const filter: Prisma.DateTimeFilter = {};

  if (dateFilter.dateFrom) {
    filter.gte = new Date(dateFilter.dateFrom);
  }

  if (dateFilter.dateTo) {
    filter.lte = new Date(dateFilter.dateTo);
  }

  return filter;
}
