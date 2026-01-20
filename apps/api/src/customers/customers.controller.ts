import { Controller, Get, Query, Param, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { ListCustomersDto } from "./dto/list-customers.dto";
import { GetCustomerDto } from "./dto/get-customer.dto";

@ApiTags("Customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Get()
  @ApiOperation({ summary: "List customers with optional filters" })
  async listCustomers(@Query() query: ListCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get("sellers")
  @ApiOperation({ summary: "Get list of unique sellers" })
  async getSellers() {
    return this.customersService.getUniqueSellers();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer details by ID including transcript" })
  async getCustomer(@Param() params: GetCustomerDto) {
    const customer = await this.customersService.findOne(params.id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${params.id} not found`);
    }
    return customer;
  }
}
