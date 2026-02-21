import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    Min,
    Matches,
    MaxLength,
    IsDecimal,
} from 'class-validator';
import { FilingStatus } from '@prisma/client';

// ─── Initiate Filing ─────────────────────────────────

export class InitiateFilingDto {
    @ApiProperty({
        description: 'Assessment year (e.g., "2025-2026")',
        example: '2025-2026',
        pattern: '^\\d{4}-\\d{4}$',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{4}$/, { message: 'Assessment year must be in format YYYY-YYYY' })
    assessmentYear: string;

    @ApiProperty({
        description: 'Service type',
        enum: ['individual', 'corporate', 'nrb'],
        example: 'individual',
    })
    @IsNotEmpty()
    @IsString()
    serviceType: string;
}

// ─── Update Filing Status (Admin) ────────────────────

export class UpdateFilingStatusDto {
    @ApiProperty({
        description: 'New filing status',
        enum: FilingStatus,
        example: 'DOCUMENTS_RECEIVED',
    })
    @IsEnum(FilingStatus)
    status: FilingStatus;

    @ApiPropertyOptional({
        description: 'Note about the status change',
        example: 'All required documents received. Moving to preparation.',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}

// ─── Assign Advisor (Admin) ──────────────────────────

export class AssignAdvisorDto {
    @ApiProperty({
        description: 'Advisor user ID to assign',
        example: 'clx...',
    })
    @IsNotEmpty()
    @IsString()
    advisorId: string;
}

// ─── Update Filing Details (Admin) ───────────────────

export class UpdateFilingDto {
    @ApiPropertyOptional({ description: 'Total income', example: '850000' })
    @IsOptional()
    @IsString()
    totalIncome?: string;

    @ApiPropertyOptional({ description: 'Tax payable', example: '45000' })
    @IsOptional()
    @IsString()
    taxPayable?: string;

    @ApiPropertyOptional({ description: 'Tax already paid', example: '30000' })
    @IsOptional()
    @IsString()
    taxPaid?: string;

    @ApiPropertyOptional({ description: 'Refund amount', example: '0' })
    @IsOptional()
    @IsString()
    refundAmount?: string;

    @ApiPropertyOptional({ description: 'Filing deadline', example: '2026-11-30T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiPropertyOptional({ description: 'Internal notes (admin only)' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    internalNotes?: string;
}

// ─── Query Filings ───────────────────────────────────

export class QueryFilingsDto {
    @ApiPropertyOptional({ enum: FilingStatus })
    @IsOptional()
    @IsEnum(FilingStatus)
    status?: FilingStatus;

    @ApiPropertyOptional({ example: '2025-2026' })
    @IsOptional()
    @IsString()
    assessmentYear?: string;

    @ApiPropertyOptional({ example: 'individual' })
    @IsOptional()
    @IsString()
    serviceType?: string;

    @ApiPropertyOptional({ description: 'Advisor ID filter' })
    @IsOptional()
    @IsString()
    advisorId?: string;

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
