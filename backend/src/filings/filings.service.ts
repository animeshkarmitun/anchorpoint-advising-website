import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { FilingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    InitiateFilingDto,
    UpdateFilingStatusDto,
    AssignAdvisorDto,
    UpdateFilingDto,
    QueryFilingsDto,
} from './dto';

@Injectable()
export class FilingsService {
    private readonly logger = new Logger(FilingsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Customer: Initiate Filing ─────────────────────

    async initiateFiling(userId: string, dto: InitiateFilingDto) {
        // Check for duplicate
        const existing = await this.prisma.filing.findUnique({
            where: {
                userId_assessmentYear: {
                    userId,
                    assessmentYear: dto.assessmentYear,
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                `You already have a filing for assessment year ${dto.assessmentYear}`,
            );
        }

        const filing = await this.prisma.filing.create({
            data: {
                userId,
                assessmentYear: dto.assessmentYear,
                serviceType: dto.serviceType,
                status: 'INITIATED',
            },
        });

        // Create initial status log
        await this.prisma.filingStatusLog.create({
            data: {
                filingId: filing.id,
                from: 'INITIATED',
                to: 'INITIATED',
                changedBy: userId,
                note: 'Filing initiated',
            },
        });

        // Notify user
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'filing_update',
                title: 'Filing Initiated 📋',
                body: `Your ${dto.serviceType} tax filing for ${dto.assessmentYear} has been created.`,
                link: `/filings/${filing.id}`,
            },
        });

        this.logger.log(`Filing initiated: ${filing.id} by ${userId}`);

        return {
            success: true,
            message: 'Filing initiated successfully',
            data: filing,
        };
    }

    // ─── Customer: List My Filings ─────────────────────

    async getMyFilings(userId: string, query: QueryFilingsDto) {
        const where: any = { userId };
        if (query.status) where.status = query.status;
        if (query.assessmentYear) where.assessmentYear = query.assessmentYear;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [filings, total] = await Promise.all([
            this.prisma.filing.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { documents: true } },
                    advisor: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
            }),
            this.prisma.filing.count({ where }),
        ]);

        return {
            success: true,
            message: 'Filings retrieved',
            data: filings,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Customer: Get Filing Details ──────────────────

    async getFilingDetails(userId: string, filingId: string) {
        const filing = await this.prisma.filing.findFirst({
            where: { id: filingId, userId },
            include: {
                documents: {
                    where: { parentId: null },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        category: true,
                        fileName: true,
                        status: true,
                        version: true,
                        createdAt: true,
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
                advisor: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
            },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        // Calculate progress
        const statusOrder: FilingStatus[] = [
            'INITIATED', 'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED',
            'UNDER_PREPARATION', 'REVIEW_READY', 'CUSTOMER_APPROVED',
            'E_FILED', 'ACKNOWLEDGED', 'COMPLETED',
        ];
        const currentIndex = statusOrder.indexOf(filing.status);
        const progress = Math.round(((currentIndex + 1) / statusOrder.length) * 100);

        // Days remaining
        let daysRemaining: number | null = null;
        if (filing.deadline) {
            const msRemaining = new Date(filing.deadline).getTime() - Date.now();
            daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
        }

        return {
            success: true,
            message: 'Filing details',
            data: {
                ...filing,
                progress,
                daysRemaining,
                statusSteps: statusOrder.map((s, i) => ({
                    status: s,
                    completed: i <= currentIndex,
                    current: i === currentIndex,
                    date: filing.statusHistory.find((h) => h.to === s)?.createdAt || null,
                })),
            },
        };
    }

    // ═══════════════════════════════════════════════
    //  Admin Endpoints
    // ═══════════════════════════════════════════════

    // ─── Admin: List All Filings ───────────────────────

    async getAllFilings(query: QueryFilingsDto) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.assessmentYear) where.assessmentYear = query.assessmentYear;
        if (query.serviceType) where.serviceType = query.serviceType;
        if (query.advisorId) where.advisorId = query.advisorId;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [filings, total] = await Promise.all([
            this.prisma.filing.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    advisor: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    _count: { select: { documents: true } },
                },
            }),
            this.prisma.filing.count({ where }),
        ]);

        return {
            success: true,
            message: 'All filings',
            data: filings,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Admin: Get Filing Details ─────────────────────

    async adminGetFilingDetails(filingId: string) {
        const filing = await this.prisma.filing.findUnique({
            where: { id: filingId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        profile: true,
                    },
                },
                advisor: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
                documents: {
                    where: { parentId: null },
                    orderBy: { createdAt: 'desc' },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        return {
            success: true,
            message: 'Filing details',
            data: filing,
        };
    }

    // ─── Admin: Update Filing Status ───────────────────

    async updateFilingStatus(
        filingId: string,
        dto: UpdateFilingStatusDto,
        adminId: string,
    ) {
        const filing = await this.prisma.filing.findUnique({
            where: { id: filingId },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        const oldStatus = filing.status;

        // Update filing status
        const updateData: any = { status: dto.status };

        // Set timestamps for specific statuses
        if (dto.status === 'E_FILED') updateData.filedAt = new Date();
        if (dto.status === 'ACKNOWLEDGED') updateData.acknowledgedAt = new Date();

        const updated = await this.prisma.filing.update({
            where: { id: filingId },
            data: updateData,
        });

        // Create status log
        await this.prisma.filingStatusLog.create({
            data: {
                filingId,
                from: oldStatus,
                to: dto.status,
                changedBy: adminId,
                note: dto.note,
            },
        });

        // Notify customer
        await this.prisma.notification.create({
            data: {
                userId: filing.userId,
                type: 'filing_update',
                title: 'Filing Status Updated 📊',
                body: `Your filing for ${filing.assessmentYear} has been updated: ${dto.status.replace(/_/g, ' ')}${dto.note ? `. ${dto.note}` : ''}`,
                link: `/filings/${filingId}`,
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'STATUS_CHANGE',
                entity: 'Filing',
                entityId: filingId,
                oldValue: { status: oldStatus },
                newValue: { status: dto.status, note: dto.note },
            },
        });

        this.logger.log(
            `Filing ${filingId} status: ${oldStatus} → ${dto.status} by ${adminId}`,
        );

        return {
            success: true,
            message: `Filing status updated to ${dto.status.replace(/_/g, ' ')}`,
            data: updated,
        };
    }

    // ─── Admin: Assign Advisor ─────────────────────────

    async assignAdvisor(filingId: string, dto: AssignAdvisorDto, adminId: string) {
        const filing = await this.prisma.filing.findUnique({
            where: { id: filingId },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        // Verify advisor exists and has correct role
        const advisor = await this.prisma.user.findFirst({
            where: { id: dto.advisorId, role: 'TAX_ADVISOR' },
        });

        if (!advisor) {
            throw new BadRequestException('Invalid advisor — user not found or not a TAX_ADVISOR');
        }

        const updated = await this.prisma.filing.update({
            where: { id: filingId },
            data: { advisorId: dto.advisorId },
        });

        // Notify both customer and advisor
        await this.prisma.notification.createMany({
            data: [
                {
                    userId: filing.userId,
                    type: 'filing_update',
                    title: 'Advisor Assigned 👤',
                    body: `A tax advisor has been assigned to your filing for ${filing.assessmentYear}.`,
                    link: `/filings/${filingId}`,
                },
                {
                    userId: dto.advisorId,
                    type: 'filing_update',
                    title: 'New Filing Assignment 📋',
                    body: `You have been assigned a ${filing.serviceType} filing for ${filing.assessmentYear}.`,
                    link: `/admin/filings/${filingId}`,
                },
            ],
        });

        this.logger.log(`Advisor ${dto.advisorId} assigned to filing ${filingId}`);

        return {
            success: true,
            message: 'Advisor assigned successfully',
            data: updated,
        };
    }

    // ─── Admin: Update Filing Details ──────────────────

    async updateFilingDetails(filingId: string, dto: UpdateFilingDto, adminId: string) {
        const filing = await this.prisma.filing.findUnique({
            where: { id: filingId },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        const updateData: any = {};
        if (dto.totalIncome !== undefined) updateData.totalIncome = new Prisma.Decimal(dto.totalIncome);
        if (dto.taxPayable !== undefined) updateData.taxPayable = new Prisma.Decimal(dto.taxPayable);
        if (dto.taxPaid !== undefined) updateData.taxPaid = new Prisma.Decimal(dto.taxPaid);
        if (dto.refundAmount !== undefined) updateData.refundAmount = new Prisma.Decimal(dto.refundAmount);
        if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);
        if (dto.internalNotes !== undefined) updateData.internalNotes = dto.internalNotes;

        const updated = await this.prisma.filing.update({
            where: { id: filingId },
            data: updateData,
        });

        return {
            success: true,
            message: 'Filing details updated',
            data: updated,
        };
    }

    // ─── Admin: Dashboard Stats ────────────────────────

    async getFilingStats() {
        const [total, byStatus, byType] = await Promise.all([
            this.prisma.filing.count(),
            this.prisma.filing.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.filing.groupBy({
                by: ['serviceType'],
                _count: true,
            }),
        ]);

        const statusCounts: Record<string, number> = {};
        byStatus.forEach((s) => (statusCounts[s.status] = s._count));

        const typeCounts: Record<string, number> = {};
        byType.forEach((t) => (typeCounts[t.serviceType] = t._count));

        return {
            success: true,
            message: 'Filing statistics',
            data: {
                total,
                byStatus: statusCounts,
                byType: typeCounts,
                active: (statusCounts['INITIATED'] || 0) +
                    (statusCounts['DOCUMENTS_PENDING'] || 0) +
                    (statusCounts['DOCUMENTS_RECEIVED'] || 0) +
                    (statusCounts['UNDER_PREPARATION'] || 0) +
                    (statusCounts['REVIEW_READY'] || 0),
                completed: statusCounts['COMPLETED'] || 0,
            },
        };
    }
}
