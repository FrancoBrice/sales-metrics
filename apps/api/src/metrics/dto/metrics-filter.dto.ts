import { IsOptional, IsString, IsDateString, ValidateIf } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class MetricsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seller?: string;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.dateFrom !== undefined)
  dateTo?: string;
}
