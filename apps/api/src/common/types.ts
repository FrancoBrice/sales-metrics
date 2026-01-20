import { Customer, Prisma } from "@prisma/client";
import { Meeting, Extraction as ExtractionData } from "@prisma/client";
import { Extraction } from "@vambe/shared";

export type CustomerWithRelations = Customer & {
  meetings: Array<
    Meeting & {
      extractions: Array<
        Prisma.ExtractionGetPayload<{
          include: { data: true };
        }>
      >;
    }
  >;
};

export type CustomerMapped = {
  id: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  meetingDate: string;
  closed: boolean;
  createdAt: string;
  meetingId: string | null;
  extraction: Extraction | null;
};

export type CustomerDetailMapped = CustomerMapped & {
  transcript: string | null;
};
