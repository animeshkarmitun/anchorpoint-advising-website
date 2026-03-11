import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ConsultationsService } from './consultations.service';
import {
    BookConsultationDto,
    RescheduleConsultationDto,
    CancelConsultationDto,
    QueryConsultationsDto,
} from './dto';

@ApiTags('Customer: Consultations')
@ApiBearerAuth('JWT-auth')
@Controller('consultations')
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Get('slots')
    @Public()
    @ApiOperation({ summary: 'Get available consultation slots', description: 'Returns available time slots for a given date.' })
    @ApiQuery({ name: 'date', required: true, example: '2026-03-15' })
    @ApiResponse({ status: 200, description: 'Available slots' })
    async getAvailableSlots(@Query('date') date: string) {
        return this.consultationsService.getAvailableSlots(date);
    }

    @Post()
    @ApiOperation({ summary: 'Book a consultation', description: 'Book a consultation slot. Auto-assigns advisor if none specified.' })
    @ApiResponse({ status: 201, description: 'Consultation booked' })
    async bookConsultation(@CurrentUser('id') clientId: string, @Body() dto: BookConsultationDto) {
        return this.consultationsService.bookConsultation(clientId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'My consultations' })
    @ApiResponse({ status: 200, description: 'Consultations list' })
    async getMyConsultations(@CurrentUser('id') clientId: string, @Query() query: QueryConsultationsDto) {
        return this.consultationsService.getMyConsultations(clientId, query);
    }

    @Put(':id/reschedule')
    @ApiOperation({ summary: 'Reschedule consultation', description: 'Must be at least 2 hours before.' })
    @ApiResponse({ status: 200, description: 'Rescheduled' })
    async reschedule(
        @CurrentUser('id') clientId: string,
        @Param('id') id: string,
        @Body() dto: RescheduleConsultationDto,
    ) {
        return this.consultationsService.rescheduleConsultation(clientId, id, dto);
    }

    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancel consultation' })
    @ApiResponse({ status: 200, description: 'Cancelled' })
    async cancel(
        @CurrentUser('id') clientId: string,
        @Param('id') id: string,
        @Body() dto: CancelConsultationDto,
    ) {
        return this.consultationsService.cancelConsultation(clientId, id, dto);
    }
}
