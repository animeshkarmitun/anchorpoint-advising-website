import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CmsService } from './cms.service';

@ApiTags('Public')
@Controller('public/cms')
@Public()
export class CmsPublicController {
    constructor(private readonly cmsService: CmsService) { }

    @Get(':section')
    @ApiOperation({ summary: 'Get CMS section content', description: 'Returns JSON content for a website section.' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'Section content' })
    async getSection(
        @Param('section') section: string,
        @Query('locale') locale?: string,
    ) {
        return this.cmsService.getSectionContent(section, locale || 'en');
    }

    @Get()
    @ApiOperation({ summary: 'Get all CMS sections' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'All sections' })
    async getAllSections(@Query('locale') locale?: string) {
        return this.cmsService.getAllSections(locale || 'en');
    }
}
