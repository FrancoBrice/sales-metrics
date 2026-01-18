import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
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
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async listCustomers(
    @Query("seller") seller?: string,
    @Query("closed") closed?: string,
    @Query("leadSource") leadSource?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("industry") industry?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return this.customersService.findAll({
      seller,
      closed: closed !== undefined ? closed === "true" : undefined,
      leadSource,
      dateFrom,
      dateTo,
      industry,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get("sellers")
  @ApiOperation({ summary: "Get list of unique sellers" })
  async getSellers() {
    return this.customersService.getUniqueSellers();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer details by ID including transcript" })
  @ApiParam({ name: "id", description: "Customer ID" })
  async getCustomer(@Param("id") id: string) {
    return this.customersService.findOne(id);
  }
}
