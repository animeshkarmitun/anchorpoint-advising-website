import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Page number (1-indexed)',
        minimum: 1,
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Field to sort by',
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: ['asc', 'desc'],
        default: 'desc',
        example: 'desc',
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    /**
     * Convert to Prisma query args
     */
    toPrismaArgs() {
        return {
            skip: ((this.page ?? 1) - 1) * (this.limit ?? 20),
            take: this.limit ?? 20,
            orderBy: {
                [this.sortBy ?? 'createdAt']: this.sortOrder ?? 'desc',
            },
        };
    }
}

/**
 * Pagination metadata for responses
 */
export class PaginationMeta {
    @ApiPropertyOptional({ example: 1 })
    page: number;

    @ApiPropertyOptional({ example: 20 })
    limit: number;

    @ApiPropertyOptional({ example: 150 })
    total: number;

    @ApiPropertyOptional({ example: 8 })
    totalPages: number;

    @ApiPropertyOptional({ example: true })
    hasNext: boolean;

    @ApiPropertyOptional({ example: false })
    hasPrev: boolean;

    static create(page: number, limit: number, total: number): PaginationMeta {
        const meta = new PaginationMeta();
        meta.page = page;
        meta.limit = limit;
        meta.total = total;
        meta.totalPages = Math.ceil(total / limit);
        meta.hasNext = page < meta.totalPages;
        meta.hasPrev = page > 1;
        return meta;
    }
}
