import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    Min,
    MinLength,
    MaxLength,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// ─── Initiate Payment ────────────────────────────────

export class InitiatePaymentDto {
    @ApiProperty({ description: 'Filing or consultation ID' })
    @IsString()
    @IsNotEmpty()
    filingId?: string;

    @ApiPropertyOptional({ description: 'Consultation ID (for consultation payments)' })
    @IsOptional()
    @IsString()
    consultationId?: string;

    @ApiProperty({ description: 'Amount in BDT', example: 5000 })
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Payment method',
        enum: PaymentMethod,
        example: 'BKASH',
    })
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @ApiPropertyOptional({ description: 'Coupon/promo code', example: 'WELCOME20' })
    @IsOptional()
    @IsString()
    couponCode?: string;
}

// ─── Refund Request ──────────────────────────────────

export class RequestRefundDto {
    @ApiProperty({
        description: 'Reason for refund request',
        minLength: 20,
        maxLength: 500,
    })
    @IsString()
    @MinLength(20)
    @MaxLength(500)
    reason: string;
}

// ─── Process Refund (Admin) ──────────────────────────

export class ProcessRefundDto {
    @ApiProperty({
        description: 'Refund decision',
        enum: ['approved', 'rejected'],
    })
    @IsString()
    @IsNotEmpty()
    status: 'approved' | 'rejected';

    @ApiPropertyOptional({ description: 'Partial refund amount (if less than full)' })
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional({ description: 'Reason for rejection' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

// ─── Query Payments ──────────────────────────────────

export class QueryPaymentsDto {
    @ApiPropertyOptional({ enum: PaymentStatus })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional({ enum: PaymentMethod })
    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @ApiPropertyOptional({ description: 'Start date', example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'End date', example: '2026-12-31' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 20;
}


