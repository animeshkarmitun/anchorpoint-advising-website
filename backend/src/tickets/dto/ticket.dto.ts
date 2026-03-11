import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
    @ApiProperty({ description: 'Ticket subject', example: 'Issue with document upload' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    subject: string;

    @ApiProperty({ enum: TicketCategory, example: 'TECHNICAL' })
    @IsEnum(TicketCategory)
    category: TicketCategory;

    @ApiProperty({ description: 'Issue description' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    description: string;
}

export class ReplyTicketDto {
    @ApiProperty({ description: 'Reply content' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'Internal note (not visible to customer)', default: false })
    @IsOptional()
    @IsBoolean()
    isInternal?: boolean = false;
}

export class UpdateTicketDto {
    @ApiPropertyOptional({ enum: TicketStatus })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @ApiPropertyOptional({ enum: TicketPriority })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;

    @ApiPropertyOptional({ description: 'Assign to staff user ID' })
    @IsOptional()
    @IsString()
    assignedTo?: string;
}

export class QueryTicketsDto {
    @ApiPropertyOptional({ enum: TicketStatus })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @ApiPropertyOptional({ enum: TicketCategory })
    @IsOptional()
    @IsEnum(TicketCategory)
    category?: TicketCategory;

    @ApiPropertyOptional({ enum: TicketPriority })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;

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
