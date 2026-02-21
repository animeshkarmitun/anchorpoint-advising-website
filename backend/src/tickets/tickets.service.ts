import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, ReplyTicketDto, UpdateTicketDto, QueryTicketsDto } from './dto';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Customer: Create Ticket ───────────────────────

    async createTicket(userId: string, dto: CreateTicketDto) {
        const ticket = await this.prisma.ticket.create({
            data: {
                userId,
                subject: dto.subject,
                category: dto.category,
                priority: 'MEDIUM',
                status: 'OPEN',
            },
        });

        // Create initial reply as description
        await this.prisma.ticketReply.create({
            data: {
                ticketId: ticket.id,
                authorId: userId,
                content: dto.description,
            },
        });

        // Notify admins
        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['SUPER_ADMIN', 'OPERATIONS', 'SUPPORT'] } },
            select: { id: true },
        });

        if (admins.length > 0) {
            await this.prisma.notification.createMany({
                data: admins.map((a) => ({
                    userId: a.id,
                    type: 'ticket',
                    title: 'New Support Ticket 🎫',
                    body: `${dto.category}: ${dto.subject}`,
                    link: `/admin/tickets/${ticket.id}`,
                })),
            });
        }

        return {
            success: true,
            message: 'Ticket created',
            data: ticket,
        };
    }

    // ─── Customer: My Tickets ──────────────────────────

    async getMyTickets(userId: string, query: QueryTicketsDto) {
        const where: any = { userId };
        if (query.status) where.status = query.status;
        if (query.category) where.category = query.category;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { _count: { select: { replies: true } } },
            }),
            this.prisma.ticket.count({ where }),
        ]);

        return {
            success: true,
            message: 'Tickets',
            data: tickets,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Customer: View Ticket ─────────────────────────

    async getTicket(userId: string, ticketId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, userId },
            include: {
                replies: {
                    where: { isInternal: false }, // Hide internal notes from customer
                    orderBy: { createdAt: 'asc' },
                },
                assignee: {
                    select: {
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        return { success: true, message: 'Ticket details', data: ticket };
    }

    // ─── Customer: Reply to Ticket ─────────────────────

    async replyToTicket(userId: string, ticketId: string, dto: ReplyTicketDto) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, userId },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        const reply = await this.prisma.ticketReply.create({
            data: {
                ticketId,
                authorId: userId,
                content: dto.content,
            },
        });

        // Re-open if resolved
        if (ticket.status === 'RESOLVED') {
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: { status: 'OPEN' },
            });
        }

        // Notify assigned agent
        if (ticket.assignedTo) {
            await this.prisma.notification.create({
                data: {
                    userId: ticket.assignedTo,
                    type: 'ticket',
                    title: 'Ticket Reply 💬',
                    body: `Customer replied to: ${ticket.subject}`,
                    link: `/admin/tickets/${ticketId}`,
                },
            });
        }

        return { success: true, message: 'Reply added', data: reply };
    }

    // ═══════════════════════════════════════════════
    //  Admin
    // ═══════════════════════════════════════════════

    async getAllTickets(query: QueryTicketsDto) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.category) where.category = query.category;
        if (query.priority) where.priority = query.priority;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    assignee: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    _count: { select: { replies: true } },
                },
            }),
            this.prisma.ticket.count({ where }),
        ]);

        return {
            success: true,
            message: 'All tickets',
            data: tickets,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async adminGetTicket(ticketId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                user: {
                    select: {
                        email: true,
                        phone: true,
                        profile: { select: { fullName: true } },
                    },
                },
                replies: { orderBy: { createdAt: 'asc' } }, // Includes internal notes
                assignee: {
                    select: {
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        return { success: true, message: 'Ticket details', data: ticket };
    }

    async updateTicket(ticketId: string, dto: UpdateTicketDto, adminId: string) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException('Ticket not found');

        const updateData: any = {};
        if (dto.status) {
            updateData.status = dto.status;
            if (dto.status === 'RESOLVED') updateData.resolvedAt = new Date();
        }
        if (dto.priority) updateData.priority = dto.priority;
        if (dto.assignedTo) updateData.assignedTo = dto.assignedTo;

        const updated = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
        });

        // Notify customer of status change
        if (dto.status) {
            await this.prisma.notification.create({
                data: {
                    userId: ticket.userId,
                    type: 'ticket',
                    title: 'Ticket Updated 🎫',
                    body: `Your ticket "${ticket.subject}" is now: ${dto.status.replace(/_/g, ' ')}`,
                    link: `/tickets/${ticketId}`,
                },
            });
        }

        return { success: true, message: 'Ticket updated', data: updated };
    }

    async adminReplyToTicket(ticketId: string, dto: ReplyTicketDto, adminId: string) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException('Ticket not found');

        const reply = await this.prisma.ticketReply.create({
            data: {
                ticketId,
                authorId: adminId,
                content: dto.content,
                isInternal: dto.isInternal || false,
            },
        });

        // Auto-change status to IN_PROGRESS if still OPEN
        if (ticket.status === 'OPEN') {
            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: { status: 'IN_PROGRESS' },
            });
        }

        // Notify customer (unless internal note)
        if (!dto.isInternal) {
            await this.prisma.notification.create({
                data: {
                    userId: ticket.userId,
                    type: 'ticket',
                    title: 'New Reply to Your Ticket 💬',
                    body: `Support replied to: ${ticket.subject}`,
                    link: `/tickets/${ticketId}`,
                },
            });
        }

        return { success: true, message: 'Reply added', data: reply };
    }
}
