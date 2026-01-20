import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetCustomerDto {
  @ApiProperty({ description: "Customer ID" })
  @IsString()
  id!: string;
}
