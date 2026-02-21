import { Controller, Get, Put, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { UpdateTicketDto, ReplyTicketDto, QueryTicketsDto } from './dto';

@ApiTags('Admin: Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('admin/tickets')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS, Role.SUPPORT)
export class AdminTicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Get()
    @ApiOperation({ summary: 'All tickets (admin)', description: 'Priority-sorted ticket queue.' })
    @ApiResponse({ status: 200, description: 'All tickets' })
    async getAll(@Query() query: QueryTicketsDto) {
        return this.ticketsService.getAllTickets(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Ticket details (admin)', description: 'Includes internal notes.' })
    @ApiResponse({ status: 200, description: 'Ticket details' })
    async getTicket(@Param('id') id: string) {
        return this.ticketsService.adminGetTicket(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update ticket', description: 'Change status, priority, or assignment.' })
    @ApiResponse({ status: 200, description: 'Updated' })
    async update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser('id') adminId: string) {
        return this.ticketsService.updateTicket(id, dto, adminId);
    }

    @Post(':id/reply')
    @ApiOperation({ summary: 'Reply to ticket (admin)', description: 'Can include internal notes.' })
    @ApiResponse({ status: 201, description: 'Reply added' })
    async reply(@Param('id') id: string, @Body() dto: ReplyTicketDto, @CurrentUser('id') adminId: string) {
        return this.ticketsService.adminReplyToTicket(id, dto, adminId);
    }
}
