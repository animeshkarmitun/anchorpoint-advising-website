import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Get My Notifications ─────────────────────────

    async getMyNotifications(
        userId: string,
        query: { page?: number; limit?: number; unreadOnly?: boolean },
    ) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const where: any = { userId };
        if (query.unreadOnly) where.read = false;

        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { userId, read: false } }),
        ]);

        return {
            success: true,
            message: 'Notifications retrieved',
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        };
    }

    // ─── Get Unread Count ──────────────────────────────

    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, read: false },
        });

        return {
            success: true,
            message: 'Unread count',
            data: { count },
        };
    }

    // ─── Mark as Read ──────────────────────────────────

    async markAsRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true, readAt: new Date() },
        });

        return {
            success: true,
            message: 'Notification marked as read',
            data: null,
        };
    }

    // ─── Mark All as Read ──────────────────────────────

    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return {
            success: true,
            message: `${result.count} notifications marked as read`,
            data: { count: result.count },
        };
    }

    // ─── Delete Notification ───────────────────────────

    async deleteNotification(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await this.prisma.notification.delete({
            where: { id: notificationId },
        });

        return {
            success: true,
            message: 'Notification deleted',
            data: null,
        };
    }

    // ─── Create Notification (internal helper) ─────────

    async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        body: string;
        link?: string;
    }) {
        return this.prisma.notification.create({ data });
    }

    // ─── Create Bulk Notifications (system) ────────────

    async createBulkNotifications(
        userIds: string[],
        data: { type: string; title: string; body: string; link?: string },
    ) {
        const notifications = userIds.map((userId) => ({
            userId,
            ...data,
        }));

        const result = await this.prisma.notification.createMany({
            data: notifications,
        });

        this.logger.log(`Bulk notification sent to ${result.count} users`);
        return result;
    }
}
