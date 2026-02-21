import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, ReplyTicketDto, QueryTicketsDto } from './dto';

@ApiTags('Customer: Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a support ticket' })
    @ApiResponse({ status: 201, description: 'Ticket created' })
    async create(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
        return this.ticketsService.createTicket(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'My tickets' })
    @ApiResponse({ status: 200, description: 'Tickets list' })
    async getMyTickets(@CurrentUser('id') userId: string, @Query() query: QueryTicketsDto) {
        return this.ticketsService.getMyTickets(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'View ticket details' })
    @ApiResponse({ status: 200, description: 'Ticket details' })
    async getTicket(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.ticketsService.getTicket(userId, id);
    }

    @Post(':id/reply')
    @ApiOperation({ summary: 'Reply to ticket' })
    @ApiResponse({ status: 201, description: 'Reply added' })
    async reply(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: ReplyTicketDto,
    ) {
        return this.ticketsService.replyToTicket(userId, id, dto);
    }
}
