import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Extraction } from "@vambe/shared";

@Injectable()
export class ExtractionParser {
  constructor(private readonly prisma: PrismaService) { }

  async parseAndSave(extractionId: string, extraction: Extraction): Promise<void> {
    await this.prisma.extractionData.upsert({
      where: { extractionId },
      create: {
        extractionId,
        industry: extraction.industry ?? null,
        businessModel: extraction.businessModel ?? null,
        jtbdPrimary: extraction.jtbdPrimary ?? [],
        painPoints: extraction.painPoints ?? [],
        leadSource: extraction.leadSource ?? null,
        processMaturity: extraction.processMaturity ?? null,
        toolingMaturity: extraction.toolingMaturity ?? null,
        knowledgeComplexity: extraction.knowledgeComplexity ?? null,
        riskLevel: extraction.riskLevel ?? null,
        integrations: extraction.integrations ?? [],
        urgency: extraction.urgency ?? null,
        successMetrics: extraction.successMetrics ?? [],
        objections: extraction.objections ?? [],
        sentiment: extraction.sentiment ?? null,
        volumeQuantity: extraction.volume?.quantity ?? null,
        volumeUnit: extraction.volume?.unit ?? null,
        volumeIsPeak: extraction.volume?.isPeak ?? false,
      },
      update: {
        industry: extraction.industry ?? null,
        businessModel: extraction.businessModel ?? null,
        jtbdPrimary: extraction.jtbdPrimary ?? [],
        painPoints: extraction.painPoints ?? [],
        leadSource: extraction.leadSource ?? null,
        processMaturity: extraction.processMaturity ?? null,
        toolingMaturity: extraction.toolingMaturity ?? null,
        knowledgeComplexity: extraction.knowledgeComplexity ?? null,
        riskLevel: extraction.riskLevel ?? null,
        integrations: extraction.integrations ?? [],
        urgency: extraction.urgency ?? null,
        successMetrics: extraction.successMetrics ?? [],
        objections: extraction.objections ?? [],
        sentiment: extraction.sentiment ?? null,
        volumeQuantity: extraction.volume?.quantity ?? null,
        volumeUnit: extraction.volume?.unit ?? null,
        volumeIsPeak: extraction.volume?.isPeak ?? false,
      },
    });
  }
}