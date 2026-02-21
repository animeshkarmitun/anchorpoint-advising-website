import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin: Staff')
@ApiBearerAuth('JWT-auth')
@Controller('admin/staff')
@Roles(Role.SUPER_ADMIN)
export class StaffController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    @ApiOperation({ summary: 'List staff members', description: 'All non-customer users with workload counts.' })
    @ApiResponse({ status: 200, description: 'Staff list' })
    async getStaff() {
        return this.analyticsService.getStaffList();
    }
}
