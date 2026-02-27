import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEmail,
    IsNumber,
    IsPositive,
    MaxLength,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ManualBkashPaymentDto {
    @ApiProperty({ description: 'Customer full name', example: 'Rahul Islam' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Customer email', example: 'rahul@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'Customer phone number', example: '01712345678' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^01[0-9]{9}$/, { message: 'Must be a valid Bangladeshi phone number (01XXXXXXXXX)' })
    phone: string;

    @ApiProperty({ description: 'Amount paid in BDT', example: 2500 })
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    amount: number;

    @ApiProperty({ description: 'Package type', example: 'consultation' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    packageType: string;

    @ApiPropertyOptional({ description: 'Payment status', example: 'Pending Verification' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ description: 'bKash number used for payment', example: '01712345678' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^01[0-9]{9}$/, { message: 'Must be a valid Bangladeshi phone number' })
    bkashNumber: string;

    @ApiProperty({ description: 'bKash transaction ID', example: 'TRX8ABC12' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    @Matches(/^[A-Z0-9]+$/, { message: 'Transaction ID must be alphanumeric uppercase' })
    transactionId: string;
}
