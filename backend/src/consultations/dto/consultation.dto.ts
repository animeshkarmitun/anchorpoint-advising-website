import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { ConsultationMedium, ConsultationStatus } from '@prisma/client';

export class BookConsultationDto {
    @ApiProperty({ description: 'Date and time of the consultation', example: '2026-03-15T10:00:00.000Z' })
    @IsDateString()
    scheduledAt: string;

    @ApiProperty({ description: 'Duration in minutes', default: 30 })
    @IsOptional()
    @IsInt()
    @Min(15)
    @Max(120)
    duration?: number = 30;

    @ApiProperty({ enum: ConsultationMedium, example: 'VIDEO' })
    @IsEnum(ConsultationMedium)
    medium: ConsultationMedium;

    @ApiPropertyOptional({ description: 'Preferred advisor ID' })
    @IsOptional()
    @IsString()
    advisorId?: string;
}

export class RescheduleConsultationDto {
    @ApiProperty({ description: 'New date and time' })
    @IsDateString()
    scheduledAt: string;
}

export class CancelConsultationDto {
    @ApiProperty({ description: 'Cancellation reason' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}

export class AddConsultationNotesDto {
    @ApiProperty({ description: 'Session notes' })
    @IsString()
    @IsNotEmpty()
    notes: string;

    @ApiPropertyOptional({ description: 'Follow-up instructions' })
    @IsOptional()
    @IsString()
    followUp?: string;
}

export class UpdateConsultationStatusDto {
    @ApiProperty({ enum: ConsultationStatus })
    @IsEnum(ConsultationStatus)
    status: ConsultationStatus;
}

export class QueryConsultationsDto {
    @ApiPropertyOptional({ enum: ConsultationStatus })
    @IsOptional()
    @IsEnum(ConsultationStatus)
    status?: ConsultationStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional()
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
