import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { IngestService } from "./ingest.service";

@ApiTags("Ingest")
@Controller("ingest")
export class IngestController {
  constructor(private readonly ingestService: IngestService) { }

  @Post("csv")
  @ApiOperation({ summary: "Upload CSV file with customer data" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    if (!file.originalname.endsWith(".csv")) {
      throw new BadRequestException("File must be a CSV");
    }

    return this.ingestService.processCsv(file.buffer);
  }
}
