import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetSellerDetailsParamDto {
  @ApiProperty({ description: "Seller name" })
  @IsString()
  seller!: string;
}
