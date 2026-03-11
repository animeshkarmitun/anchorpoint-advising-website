import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Dashboard KPIs ────────────────────────────────

    async getDashboardKpis() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalCustomers,
            prevMonthCustomers,
            thisMonthCustomers,
            activeFilings,
            prevActiveFilings,
            pendingDocuments,
            openTickets,
            monthRevenue,
            prevMonthRevenue,
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
            this.prisma.user.count({
                where: { role: 'CUSTOMER', createdAt: { lt: startOfMonth } },
            }),
            this.prisma.user.count({
                where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } },
            }),
            this.prisma.filing.count({
                where: { status: { notIn: ['COMPLETED', 'ON_HOLD'] } },
            }),
            this.prisma.filing.count({
                where: {
                    status: { notIn: ['COMPLETED', 'ON_HOLD'] },
                    createdAt: { lt: startOfMonth },
                },
            }),
            this.prisma.document.count({ where: { status: 'PENDING' } }),
            this.prisma.ticket.count({
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startOfPrevMonth, lt: startOfMonth },
                },
                _sum: { amount: true },
            }),
        ]);

        const revenueThisMonth = Number(monthRevenue._sum.amount || 0);
        const revenuePrevMonth = Number(prevMonthRevenue._sum.amount || 0);

        return {
            success: true,
            message: 'Dashboard KPIs',
            data: {
                totalCustomers: {
                    value: totalCustomers,
                    change: thisMonthCustomers,
                    changeLabel: `+${thisMonthCustomers} this month`,
                },
                activeFilings: {
                    value: activeFilings,
                    change: activeFilings - prevActiveFilings,
                },
                revenueThisMonth: {
                    value: revenueThisMonth,
                    change: revenuePrevMonth > 0
                        ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
                        : 0,
                    changeLabel: revenuePrevMonth > 0
                        ? `${Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)}% vs last month`
                        : 'N/A',
                },
                pendingDocuments: { value: pendingDocuments },
                openTickets: { value: openTickets },
            },
        };
    }

    // ─── Customer Growth ───────────────────────────────

    async getCustomerGrowth(months = 12) {
        const data: Array<{ month: string; count: number; cumulative: number }> = [];
        let cumulative = 0;

        for (let i = months - 1; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i, 1);
            monthStart.setHours(0, 0, 0, 0);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);

            const count = await this.prisma.user.count({
                where: {
                    role: 'CUSTOMER',
                    createdAt: { gte: monthStart, lt: monthEnd },
                },
            });

            cumulative += count;
            data.push({
                month: monthStart.toISOString().slice(0, 7),
                count,
                cumulative,
            });
        }

        return {
            success: true,
            message: 'Customer growth',
            data,
        };
    }

    // ─── Filing Performance ────────────────────────────

    async getFilingPerformance() {
        const [byStatus, byType, avgProcessing, advisorStats] = await Promise.all([
            this.prisma.filing.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.filing.groupBy({
                by: ['serviceType'],
                _count: true,
            }),
            // Average time to completion (rough estimate)
            this.prisma.filing.findMany({
                where: { status: 'COMPLETED' },
                select: { createdAt: true, updatedAt: true },
            }),
            // Per-advisor stats
            this.prisma.filing.groupBy({
                by: ['advisorId'],
                _count: true,
                where: { advisorId: { not: null } },
            }),
        ]);

        const avgDays = avgProcessing.length > 0
            ? Math.round(
                avgProcessing.reduce((sum, f) => {
                    const days = (f.updatedAt.getTime() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                    return sum + days;
                }, 0) / avgProcessing.length,
            )
            : 0;

        // Enrich advisor stats
        const advisorDetails = await Promise.all(
            advisorStats.map(async (a) => {
                if (!a.advisorId) return null;
                const advisor = await this.prisma.user.findUnique({
                    where: { id: a.advisorId },
                    select: {
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                });
                return {
                    advisorId: a.advisorId,
                    name: advisor?.profile?.fullName || advisor?.email,
                    filingCount: a._count,
                };
            }),
        );

        return {
            success: true,
            message: 'Filing performance',
            data: {
                byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
                byType: byType.map((t) => ({ type: t.serviceType, count: t._count })),
                averageProcessingDays: avgDays,
                advisorPerformance: advisorDetails.filter(Boolean),
            },
        };
    }

    // ─── Audit Log ─────────────────────────────────────

    async getAuditLogs(query: {
        page?: number;
        limit?: number;
        userId?: string;
        entity?: string;
        action?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.entity) where.entity = query.entity;
        if (query.action) where.action = query.action;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }

        const page = query.page || 1;
        const limit = query.limit || 50;

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            email: true,
                            role: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            success: true,
            message: 'Audit logs',
            data: logs,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Admin: Customer List ──────────────────────────

    async getCustomerList(query: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }) {
        const where: any = { role: 'CUSTOMER' };
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { email: { contains: query.search, mode: 'insensitive' } },
                {
                    profile: {
                        fullName: { contains: query.search, mode: 'insensitive' },
                    },
                },
            ];
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [customers, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    status: true,
                    emailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                    profile: {
                        select: {
                            fullName: true,
                            tin: true,
                            nid: true,
                            taxpayerCategory: true,
                            vip: true,
                            onboardingDone: true,
                        },
                    },
                    _count: {
                        select: {
                            filings: true,
                            payments: true,
                            documents: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            success: true,
            message: 'Customers',
            data: customers,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Admin: Staff Management ──────────────────────

    async getStaffList() {
        const staff = await this.prisma.user.findMany({
            where: { role: { not: 'CUSTOMER' } },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                profile: {
                    select: { fullName: true },
                },
                _count: {
                    select: {
                        assignedFilings: true,
                        assignedTickets: true,
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Staff members',
            data: staff,
        };
    }
}
