import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { ProcessRefundDto, QueryPaymentsDto } from './dto';

@ApiTags('Admin: Payments')
@ApiBearerAuth('JWT-auth')
@Controller('admin/payments')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class AdminPaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get()
    @ApiOperation({ summary: 'List all payments (admin)' })
    @ApiResponse({ status: 200, description: 'All payments' })
    async getAllPayments(@Query() query: QueryPaymentsDto) {
        return this.paymentsService.getAllPayments(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Revenue statistics', description: 'Revenue by month, year, all-time, broken down by method and status.' })
    @ApiResponse({ status: 200, description: 'Revenue stats' })
    async getRevenueStats() {
        return this.paymentsService.getRevenueStats();
    }

    @Get('refunds')
    @ApiOperation({ summary: 'Refund queue', description: 'List all pending refund requests.' })
    @ApiResponse({ status: 200, description: 'Pending refunds' })
    async getRefundQueue() {
        return this.paymentsService.getRefundQueue();
    }

    @Put('refunds/:id')
    @ApiOperation({ summary: 'Process a refund', description: 'Approve or reject a refund request.' })
    @ApiResponse({ status: 200, description: 'Refund processed' })
    async processRefund(
        @Param('id') id: string,
        @Body() dto: ProcessRefundDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.paymentsService.processRefund(id, dto, adminId);
    }
}
