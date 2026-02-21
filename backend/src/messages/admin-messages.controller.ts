import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

@ApiTags('Admin: Messages')
@ApiBearerAuth('JWT-auth')
@Controller('admin/messages')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class AdminMessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post('broadcast')
    @ApiOperation({ summary: 'Broadcast notification', description: 'Send a notification to all active customers.' })
    @ApiResponse({ status: 201, description: 'Broadcast sent' })
    async broadcast(
        @CurrentUser('id') adminId: string,
        @Body() body: { title: string; body: string; link?: string },
    ) {
        return this.messagesService.broadcastNotification(adminId, body.title, body.body, body.link);
    }
}
