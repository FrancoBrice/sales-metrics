-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionData" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "industry" TEXT,
    "businessModel" TEXT,
    "jtbdPrimary" TEXT[],
    "painPoints" TEXT[],
    "leadSource" TEXT,
    "processMaturity" TEXT,
    "toolingMaturity" TEXT,
    "knowledgeComplexity" TEXT,
    "riskLevel" TEXT,
    "integrations" TEXT[],
    "urgency" TEXT,
    "successMetrics" TEXT[],
    "objections" TEXT[],
    "sentiment" TEXT,
    "volumeQuantity" DOUBLE PRECISION,
    "volumeUnit" TEXT,
    "volumeIsPeak" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmApiLog" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" TEXT,
    "response" TEXT NOT NULL,
    "error" TEXT,
    "durationMs" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Extraction_meetingId_key" ON "Extraction"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionData_extractionId_key" ON "ExtractionData"("extractionId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionData" ADD CONSTRAINT "ExtractionData_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmApiLog" ADD CONSTRAINT "LlmApiLog_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

