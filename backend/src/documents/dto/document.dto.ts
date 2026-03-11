import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    Min,
    MinLength,
    MaxLength,
} from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@prisma/client';

// ─── Upload Document ─────────────────────────────────

export class UploadDocumentDto {
    @ApiProperty({
        description: 'Document category',
        enum: DocumentCategory,
        example: 'SALARY_CERTIFICATE',
    })
    @IsEnum(DocumentCategory)
    category: DocumentCategory;

    @ApiPropertyOptional({
        description: 'Filing ID to associate the document with',
        example: 'clx123...',
    })
    @IsOptional()
    @IsString()
    filingId?: string;
}

// ─── Review Document (Admin) ─────────────────────────

export class ReviewDocumentDto {
    @ApiProperty({
        description: 'New status for the document',
        enum: ['ACCEPTED', 'REJECTED', 'NEEDS_REUPLOAD'],
        example: 'ACCEPTED',
    })
    @IsEnum(DocumentStatus)
    status: DocumentStatus;

    @ApiPropertyOptional({
        description: 'Rejection reason or re-upload instructions (required for REJECTED/NEEDS_REUPLOAD)',
        example: 'Document is blurry and unreadable. Please upload a clearer scan.',
        minLength: 10,
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    rejectionNote?: string;
}

// ─── Query Documents ─────────────────────────────────

export class QueryDocumentsDto {
    @ApiPropertyOptional({ enum: DocumentCategory })
    @IsOptional()
    @IsEnum(DocumentCategory)
    category?: DocumentCategory;

    @ApiPropertyOptional({ enum: DocumentStatus })
    @IsOptional()
    @IsEnum(DocumentStatus)
    status?: DocumentStatus;

    @ApiPropertyOptional({ description: 'Filing ID filter' })
    @IsOptional()
    @IsString()
    filingId?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number = 20;
}

// ─── Request Additional Documents (Admin) ────────────

export class RequestDocumentDto {
    @ApiProperty({ description: 'Customer user ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        description: 'Document category requested',
        enum: DocumentCategory,
    })
    @IsEnum(DocumentCategory)
    category: DocumentCategory;

    @ApiPropertyOptional({
        description: 'Filing ID to associate the request with',
    })
    @IsOptional()
    @IsString()
    filingId?: string;

    @ApiProperty({
        description: 'Instructions for the customer',
        example: 'Please upload your latest bank statement for the past 6 months.',
    })
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    note: string;
}
