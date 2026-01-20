import { Controller, Post, Param, Get, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ExtractService } from "./extract.service";
import { ExtractMeetingDto } from "./dto/extract-meeting.dto";

@ApiTags("Extract")
@Controller("extract")
export class ExtractController {
  constructor(private readonly extractService: ExtractService) { }

  @Post(":meetingId")
  @ApiOperation({ summary: "Run extraction on a meeting transcript" })
  async extractMeeting(@Param() params: ExtractMeetingDto) {
    const result = await this.extractService.extractFromMeeting(params.meetingId);
    if (!result) {
      throw new NotFoundException(`Meeting ${params.meetingId} not found`);
    }
    return result;
  }

  @Get(":meetingId")
  @ApiOperation({ summary: "Get extraction results for a meeting" })
  async getExtraction(@Param() params: ExtractMeetingDto) {
    const result = await this.extractService.getExtractionByMeetingId(params.meetingId);
    if (!result) {
      throw new NotFoundException(`Extraction for meeting ${params.meetingId} not found`);
    }
    return result;
  }

  @Post("bulk/all")
  @ApiOperation({ summary: "Run extraction on all meetings without extractions" })
  async extractAll() {
    return this.extractService.extractAllPending();
  }

  @Post("bulk/retry-failed")
  @ApiOperation({ summary: "Retry extraction on all failed extractions" })
  async retryFailed() {
    return this.extractService.retryFailedExtractions();
  }

  @Post("bulk/pending-and-failed")
  @ApiOperation({ summary: "Extract all pending and retry failed extractions" })
  async extractPendingAndFailed() {
    return this.extractService.extractAllPendingAndFailed();
  }
}
