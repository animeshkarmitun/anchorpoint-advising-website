import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SeoService {
    private readonly logger = new Logger(SeoService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Public: Get SEO for a page ────────────────────

    async getSeoForPage(page: string, locale = 'en') {
        const seo = await this.prisma.seoMeta.findUnique({
            where: { page_locale: { page, locale } },
        });

        return {
            success: true,
            message: seo ? 'SEO metadata found' : 'No custom SEO',
            data: seo,
        };
    }

    // ─── Admin: List all SEO records ───────────────────

    async listAllSeo(locale?: string) {
        const where = locale ? { locale } : {};

        const records = await this.prisma.seoMeta.findMany({
            where,
            orderBy: [{ page: 'asc' }, { locale: 'asc' }],
        });

        // Add completion status
        const enriched = records.map((r) => ({
            ...r,
            isComplete: !!(r.metaTitle && r.metaDescription && r.ogTitle && r.ogDescription),
            titleLength: r.metaTitle?.length || 0,
            descriptionLength: r.metaDescription?.length || 0,
        }));

        return {
            success: true,
            message: 'All SEO records',
            data: enriched,
        };
    }

    // ─── Admin: Upsert SEO ────────────────────────────

    async upsertSeo(
        page: string,
        locale: string,
        data: {
            metaTitle?: string;
            metaDescription?: string;
            ogTitle?: string;
            ogDescription?: string;
            ogImage?: string;
            canonicalUrl?: string;
            robots?: string;
            structuredData?: any;
        },
        adminId: string,
    ) {
        const existing = await this.prisma.seoMeta.findUnique({
            where: { page_locale: { page, locale } },
        });

        const result = await this.prisma.seoMeta.upsert({
            where: { page_locale: { page, locale } },
            update: { ...data, updatedBy: adminId },
            create: { page, locale, ...data, updatedBy: adminId },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: existing ? 'UPDATE' : 'CREATE',
                entity: 'SeoMeta',
                entityId: result.id,
                oldValue: existing
                    ? {
                        metaTitle: existing.metaTitle,
                        metaDescription: existing.metaDescription,
                    }
                    : Prisma.JsonNull,
                newValue: { metaTitle: data.metaTitle, metaDescription: data.metaDescription } as Prisma.InputJsonValue,
            },
        });

        this.logger.log(`SEO for "${page}" (${locale}) updated`);

        return {
            success: true,
            message: `SEO for "${page}" updated`,
            data: result,
        };
    }

    // ─── Admin: Delete SEO Record ──────────────────────

    async deleteSeo(page: string, locale: string, adminId: string) {
        const existing = await this.prisma.seoMeta.findUnique({
            where: { page_locale: { page, locale } },
        });

        if (!existing) throw new NotFoundException('SEO record not found');

        await this.prisma.seoMeta.delete({ where: { id: existing.id } });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'DELETE',
                entity: 'SeoMeta',
                entityId: existing.id,
                oldValue: { page, locale, metaTitle: existing.metaTitle },
            },
        });

        return {
            success: true,
            message: `SEO for "${page}" (${locale}) deleted — will fall back to defaults`,
            data: null,
        };
    }

    // ─── Public: Generate Sitemap ──────────────────────

    async generateSitemap(baseUrl: string) {
        const pages = await this.prisma.seoMeta.findMany({
            where: {
                robots: { contains: 'index' },
                locale: 'en', // Only English for sitemap
            },
            select: { page: true, updatedAt: true },
        });

        const urls = pages.map(
            (p) =>
                `  <url>\n    <loc>${baseUrl}/${p.page === 'home' ? '' : p.page}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p.page === 'home' ? '1.0' : '0.8'}</priority>\n  </url>`,
        );

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

        return sitemap;
    }
}
