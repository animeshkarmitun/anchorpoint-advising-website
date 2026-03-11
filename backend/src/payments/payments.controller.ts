import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, RequestRefundDto, QueryPaymentsDto } from './dto';

@ApiTags('Customer: Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @ApiOperation({ summary: 'Initiate a payment', description: 'Start a payment for a filing or consultation. Supports coupon codes.' })
    @ApiResponse({ status: 201, description: 'Payment initiated' })
    async initiatePayment(@CurrentUser('id') userId: string, @Body() dto: InitiatePaymentDto) {
        return this.paymentsService.initiatePayment(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'My payment history', description: 'List all payments with total spent.' })
    @ApiResponse({ status: 200, description: 'Payments list' })
    async getMyPayments(@CurrentUser('id') userId: string, @Query() query: QueryPaymentsDto) {
        return this.paymentsService.getMyPayments(userId, query);
    }

    @Post(':id/refund')
    @ApiOperation({ summary: 'Request a refund', description: 'Request refund for a completed payment.' })
    @ApiResponse({ status: 201, description: 'Refund request submitted' })
    async requestRefund(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: RequestRefundDto,
    ) {
        return this.paymentsService.requestRefund(userId, id, dto);
    }
}
