import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin: Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/audit-logs')
@Roles(Role.SUPER_ADMIN)
export class AuditLogController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    @ApiOperation({ summary: 'Audit logs', description: 'Immutable log of all admin actions. Filterable and read-only.' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'entity', required: false })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'dateFrom', required: false })
    @ApiQuery({ name: 'dateTo', required: false })
    @ApiResponse({ status: 200, description: 'Audit log entries' })
    async getLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('userId') userId?: string,
        @Query('entity') entity?: string,
        @Query('action') action?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        return this.analyticsService.getAuditLogs({
            page: page ? +page : undefined,
            limit: limit ? +limit : undefined,
            userId,
            entity,
            action,
            dateFrom,
            dateTo,
        });
    }
}
