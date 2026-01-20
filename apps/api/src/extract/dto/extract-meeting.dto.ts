import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ExtractMeetingDto {
  @ApiProperty({ description: "Meeting ID" })
  @IsString()
  meetingId!: string;
}
