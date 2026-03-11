import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

@ApiTags('Customer: Messages')
@ApiBearerAuth('JWT-auth')
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get('conversations')
    @ApiOperation({ summary: 'My conversations', description: 'Get all conversations with unread counts.' })
    @ApiResponse({ status: 200, description: 'Conversations list' })
    async getConversations(@CurrentUser('id') userId: string) {
        return this.messagesService.getMyConversations(userId);
    }

    @Get('conversations/:id')
    @ApiOperation({ summary: 'Get messages', description: 'Get messages in a conversation (auto-marks as read).' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Messages' })
    async getMessages(
        @CurrentUser('id') userId: string,
        @Param('id') conversationId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.messagesService.getMessages(userId, conversationId, page ? +page : 1, limit ? +limit : 50);
    }

    @Post('send')
    @ApiOperation({ summary: 'Send a message' })
    @ApiResponse({ status: 201, description: 'Message sent' })
    async sendMessage(
        @CurrentUser('id') senderId: string,
        @Body() body: { receiverId: string; content: string; attachmentKey?: string },
    ) {
        return this.messagesService.sendMessage(senderId, body.receiverId, body.content, body.attachmentKey);
    }

    @Put('conversations/:id/read')
    @ApiOperation({ summary: 'Mark conversation as read' })
    @ApiResponse({ status: 200, description: 'Messages marked as read' })
    async markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.messagesService.markConversationRead(userId, id);
    }
}
