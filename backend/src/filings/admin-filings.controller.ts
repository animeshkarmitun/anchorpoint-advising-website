import {
    Controller,
    Get,
    Put,
    Param,
    Query,
    Body,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilingsService } from './filings.service';
import {
    UpdateFilingStatusDto,
    AssignAdvisorDto,
    UpdateFilingDto,
    QueryFilingsDto,
} from './dto';

@ApiTags('Admin: Filings')
@ApiBearerAuth('JWT-auth')
@Controller('admin/filings')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS, Role.TAX_ADVISOR)
export class AdminFilingsController {
    constructor(private readonly filingsService: FilingsService) { }

    @Get()
    @ApiOperation({
        summary: 'List all filings (admin)',
        description: 'List all customer filings with filtering by status, year, type, and advisor.',
    })
    @ApiResponse({ status: 200, description: 'All filings' })
    async getAllFilings(@Query() query: QueryFilingsDto) {
        return this.filingsService.getAllFilings(query);
    }

    @Get('stats')
    @Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
    @ApiOperation({
        summary: 'Get filing statistics',
        description: 'Returns total filings, breakdown by status and type, active and completed counts.',
    })
    @ApiResponse({ status: 200, description: 'Filing statistics' })
    async getFilingStats() {
        return this.filingsService.getFilingStats();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get filing details (admin)',
        description: 'Full filing details including customer profile, documents, and status history.',
    })
    @ApiResponse({ status: 200, description: 'Filing details' })
    async getFilingDetails(@Param('id') id: string) {
        return this.filingsService.adminGetFilingDetails(id);
    }

    @Put(':id/status')
    @ApiOperation({
        summary: 'Update filing status',
        description:
            'Advance or change the filing status. Creates a status log entry and notifies the customer.',
    })
    @ApiResponse({ status: 200, description: 'Status updated' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateFilingStatusDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.filingsService.updateFilingStatus(id, dto, adminId);
    }

    @Put(':id/assign')
    @Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
    @ApiOperation({
        summary: 'Assign advisor to filing',
        description: 'Assign a TAX_ADVISOR to a filing. Both customer and advisor are notified.',
    })
    @ApiResponse({ status: 200, description: 'Advisor assigned' })
    async assignAdvisor(
        @Param('id') id: string,
        @Body() dto: AssignAdvisorDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.filingsService.assignAdvisor(id, dto, adminId);
    }

    @Put(':id/details')
    @ApiOperation({
        summary: 'Update filing financial details',
        description: 'Update income, tax payable/paid, refund amount, deadline, and internal notes.',
    })
    @ApiResponse({ status: 200, description: 'Details updated' })
    async updateDetails(
        @Param('id') id: string,
        @Body() dto: UpdateFilingDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.filingsService.updateFilingDetails(id, dto, adminId);
    }
}
