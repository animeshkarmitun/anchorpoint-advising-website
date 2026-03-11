import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin: Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('admin/dashboard')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class DashboardController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('kpis')
    @ApiOperation({ summary: 'Dashboard KPI cards', description: 'Total customers, active filings, revenue, pending docs, open tickets with MoM change.' })
    @ApiResponse({ status: 200, description: 'KPI data' })
    async getKpis() {
        return this.analyticsService.getDashboardKpis();
    }

    @Get('customer-growth')
    @ApiOperation({ summary: 'Customer growth chart', description: 'Monthly new signups and cumulative total.' })
    @ApiQuery({ name: 'months', required: false, example: 12 })
    @ApiResponse({ status: 200, description: 'Growth data' })
    async getGrowth(@Query('months') months?: number) {
        return this.analyticsService.getCustomerGrowth(months ? +months : 12);
    }

    @Get('filing-performance')
    @ApiOperation({ summary: 'Filing performance report', description: 'By status, type, advisor, and average processing time.' })
    @ApiResponse({ status: 200, description: 'Filing performance' })
    async getFilingPerformance() {
        return this.analyticsService.getFilingPerformance();
    }
}
