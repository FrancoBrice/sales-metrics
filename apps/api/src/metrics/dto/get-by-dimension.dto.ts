import { IsString, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetByDimensionDto {
  @ApiProperty({
    description: "Dimension to analyze",
    enum: ["leadSource", "industry", "seller", "painPoints"],
  })
  @IsString()
  @IsIn(["leadSource", "industry", "seller", "painPoints"])
  dimension!: string;
}
