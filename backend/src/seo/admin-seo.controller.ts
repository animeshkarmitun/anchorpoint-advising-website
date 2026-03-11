import { Controller, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SeoService } from './seo.service';

@ApiTags('Admin: SEO')
@ApiBearerAuth('JWT-auth')
@Controller('admin/seo')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class AdminSeoController {
    constructor(private readonly seoService: SeoService) { }

    @Get()
    @ApiOperation({ summary: 'List all SEO records', description: 'Shows completeness status and character counts.' })
    @ApiQuery({ name: 'locale', required: false })
    @ApiResponse({ status: 200, description: 'All SEO records' })
    async listAll(@Query('locale') locale?: string) {
        return this.seoService.listAllSeo(locale);
    }

    @Put(':page')
    @ApiOperation({ summary: 'Create or update SEO for a page' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'SEO updated' })
    async upsert(
        @Param('page') page: string,
        @Query('locale') locale: string,
        @Body() data: any,
        @CurrentUser('id') adminId: string,
    ) {
        return this.seoService.upsertSeo(page, locale || 'en', data, adminId);
    }

    @Delete(':page')
    @ApiOperation({ summary: 'Delete SEO record', description: 'Falls back to default content JSON.' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'SEO deleted' })
    async delete(
        @Param('page') page: string,
        @Query('locale') locale: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.seoService.deleteSeo(page, locale || 'en', adminId);
    }
}
