import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Customer: Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({
        summary: 'Get my notifications',
        description: 'List all notifications for the authenticated user with optional unread filter.',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Notifications list with unread count' })
    async getMyNotifications(
        @CurrentUser('id') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('unreadOnly') unreadOnly?: boolean,
    ) {
        return this.notificationsService.getMyNotifications(userId, {
            page: page ? +page : undefined,
            limit: limit ? +limit : undefined,
            unreadOnly: unreadOnly === true || unreadOnly === ('true' as any),
        });
    }

    @Get('unread-count')
    @ApiOperation({
        summary: 'Get unread notification count',
        description: 'Returns just the count of unread notifications. Useful for badge updates.',
    })
    @ApiResponse({ status: 200, description: 'Unread count' })
    async getUnreadCount(@CurrentUser('id') userId: string) {
        return this.notificationsService.getUnreadCount(userId);
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    @ApiResponse({ status: 200, description: 'Marked as read' })
    async markAsRead(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.notificationsService.markAsRead(userId, id);
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All marked as read' })
    async markAllAsRead(@CurrentUser('id') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ApiResponse({ status: 200, description: 'Notification deleted' })
    async deleteNotification(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.notificationsService.deleteNotification(userId, id);
    }
}
