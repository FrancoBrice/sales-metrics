import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";

@ApiTags("Customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Get()
  @ApiOperation({ summary: "List customers with optional filters" })
  @ApiQuery({ name: "seller", required: false })
  @ApiQuery({ name: "closed", required: false, type: Boolean })
  @ApiQuery({ name: "leadSource", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  @ApiQuery({ name: "industry", required: false })
  async listCustomers(
    @Query("seller") seller?: string,
    @Query("closed") closed?: string,
    @Query("leadSource") leadSource?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("industry") industry?: string
  ) {
    return this.customersService.findAll({
      seller,
      closed: closed !== undefined ? closed === "true" : undefined,
      leadSource,
      dateFrom,
      dateTo,
      industry,
    });
  }

  @Get("sellers")
  @ApiOperation({ summary: "Get list of unique sellers" })
  async getSellers() {
    return this.customersService.getUniqueSellers();
  }
}
