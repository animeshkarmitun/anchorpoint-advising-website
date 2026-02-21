import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { SeoService } from './seo.service';

@ApiTags('Public')
@Controller('public/seo')
@Public()
export class SeoPublicController {
    constructor(
        private readonly seoService: SeoService,
        private readonly config: ConfigService,
    ) { }

    @Get(':page')
    @ApiOperation({ summary: 'Get SEO metadata for a page' })
    @ApiQuery({ name: 'locale', required: false, example: 'en' })
    @ApiResponse({ status: 200, description: 'SEO metadata' })
    async getSeo(
        @Param('page') page: string,
        @Query('locale') locale?: string,
    ) {
        return this.seoService.getSeoForPage(page, locale || 'en');
    }

    @Get('sitemap.xml')
    @ApiOperation({ summary: 'Generate sitemap.xml' })
    @ApiResponse({ status: 200, description: 'XML sitemap' })
    async sitemap(@Res() res: Response) {
        const baseUrl = this.config.get('FRONTEND_URL') || 'https://anchorpointadvising.com';
        const xml = await this.seoService.generateSitemap(baseUrl);
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    }
}
