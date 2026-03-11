import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CmsService {
    private readonly logger = new Logger(CmsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Public: Get Section Content ───────────────────

    async getSectionContent(section: string, locale = 'en') {
        const content = await this.prisma.cmsContent.findUnique({
            where: { section_locale: { section, locale } },
        });

        return {
            success: true,
            message: content ? 'Content found' : 'No custom content',
            data: content,
        };
    }

    // ─── Public: Get All Sections ──────────────────────

    async getAllSections(locale = 'en') {
        const sections = await this.prisma.cmsContent.findMany({
            where: { locale },
            orderBy: { section: 'asc' },
        });

        return {
            success: true,
            message: 'All sections',
            data: sections,
        };
    }

    // ─── Admin: Upsert Section Content ─────────────────

    async upsertSection(
        section: string,
        locale: string,
        data: any,
        adminId: string,
    ) {
        const existing = await this.prisma.cmsContent.findUnique({
            where: { section_locale: { section, locale } },
        });

        const result = await this.prisma.cmsContent.upsert({
            where: { section_locale: { section, locale } },
            update: { data, updatedBy: adminId },
            create: { section, locale, data, updatedBy: adminId },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: existing ? 'UPDATE' : 'CREATE',
                entity: 'CmsContent',
                entityId: result.id,
                oldValue: existing?.data ?? Prisma.JsonNull,
                newValue: data,
            },
        });

        this.logger.log(`CMS section "${section}" (${locale}) updated by ${adminId}`);

        return {
            success: true,
            message: `Section "${section}" updated`,
            data: result,
        };
    }

    // ─── Admin: Delete Section ─────────────────────────

    async deleteSection(section: string, locale: string, adminId: string) {
        const existing = await this.prisma.cmsContent.findUnique({
            where: { section_locale: { section, locale } },
        });

        if (!existing) throw new NotFoundException('Section not found');

        await this.prisma.cmsContent.delete({
            where: { id: existing.id },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'DELETE',
                entity: 'CmsContent',
                entityId: existing.id,
                oldValue: existing.data as Prisma.InputJsonValue,
            },
        });

        return {
            success: true,
            message: `Section "${section}" deleted`,
            data: null,
        };
    }

    // ─── Admin: List all content ───────────────────────

    async listAllContent() {
        const content = await this.prisma.cmsContent.findMany({
            orderBy: [{ section: 'asc' }, { locale: 'asc' }],
        });

        return {
            success: true,
            message: 'All CMS content',
            data: content,
        };
    }
}
