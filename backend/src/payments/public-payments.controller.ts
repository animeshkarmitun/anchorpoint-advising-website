import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { ManualBkashPaymentDto } from './dto/manual-bkash.dto';

@ApiTags('Public')
@Controller('public/payments')
export class PublicPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/v1/public/payments/manual-bkash
   *
   * Records a manual bKash payment submitted by a customer
   * on the public website (no authentication required).
   * Customer details are stored in the Payment record's
   * gatewayResponse JSON field for admin review.
   */
  @Public()
  @Post('manual-bkash')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record manual bKash payment',
    description:
      'Public endpoint for recording manual bKash payments from the website. ' +
      'No authentication required. Admin is notified for verification.',
  })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate transaction ID' })
  async recordManualBkash(@Body() dto: ManualBkashPaymentDto) {
    return this.paymentsService.recordManualBkashPayment(dto);
  }
}
