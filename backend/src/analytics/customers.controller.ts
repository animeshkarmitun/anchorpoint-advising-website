import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin: Customers')
@ApiBearerAuth('JWT-auth')
@Controller('admin/customers')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class CustomersController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    @ApiOperation({ summary: 'List all customers', description: 'Searchable customer list with profile, filing, and payment counts.' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiResponse({ status: 200, description: 'Customers list' })
    async getCustomers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.analyticsService.getCustomerList({
            page: page ? +page : undefined,
            limit: limit ? +limit : undefined,
            search,
            status,
        });
    }
}
