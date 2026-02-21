import { Controller, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CmsService } from './cms.service';

@ApiTags('Admin: CMS')
@ApiBearerAuth('JWT-auth')
@Controller('admin/cms')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class AdminCmsController {
    constructor(private readonly cmsService: CmsService) { }

    @Get()
    @ApiOperation({ summary: 'List all CMS content' })
    @ApiResponse({ status: 200, description: 'All sections' })
    async listAll() {
        return this.cmsService.listAllContent();
    }

    @Put(':section')
    @ApiOperation({ summary: 'Create or update CMS section', description: 'Upserts section content with audit logging.' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'Section updated' })
    async upsert(
        @Param('section') section: string,
        @Query('locale') locale: string,
        @Body() body: { data: any },
        @CurrentUser('id') adminId: string,
    ) {
        return this.cmsService.upsertSection(section, locale || 'en', body.data, adminId);
    }

    @Delete(':section')
    @ApiOperation({ summary: 'Delete CMS section', description: 'Reverts to default content from JSON files.' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'Section deleted' })
    async delete(
        @Param('section') section: string,
        @Query('locale') locale: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.cmsService.deleteSection(section, locale || 'en', adminId);
    }
}
