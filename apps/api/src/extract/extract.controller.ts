import { Controller, Post, Param, Get, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { ExtractService } from "./extract.service";

@ApiTags("Extract")
@Controller("extract")
export class ExtractController {
  constructor(private readonly extractService: ExtractService) { }

  @Post(":meetingId")
  @ApiOperation({ summary: "Run extraction on a meeting transcript" })
  @ApiParam({ name: "meetingId", description: "Meeting ID to extract from" })
  async extractMeeting(@Param("meetingId") meetingId: string) {
    const result = await this.extractService.extractFromMeeting(meetingId);
    if (!result) {
      throw new NotFoundException(`Meeting ${meetingId} not found`);
    }
    return result;
  }

  @Get(":meetingId")
  @ApiOperation({ summary: "Get extraction results for a meeting" })
  @ApiParam({ name: "meetingId", description: "Meeting ID" })
  async getExtraction(@Param("meetingId") meetingId: string) {
    return this.extractService.getExtractionByMeetingId(meetingId);
  }

  @Post("bulk/all")
  @ApiOperation({ summary: "Run extraction on all meetings without extractions" })
  async extractAll() {
    return this.extractService.extractAllPending();
  }
}
