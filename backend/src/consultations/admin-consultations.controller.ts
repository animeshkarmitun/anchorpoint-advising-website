import { Controller, Get, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConsultationsService } from './consultations.service';
import {
    UpdateConsultationStatusDto,
    AddConsultationNotesDto,
    QueryConsultationsDto,
} from './dto';

@ApiTags('Admin: Consultations')
@ApiBearerAuth('JWT-auth')
@Controller('admin/consultations')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS, Role.TAX_ADVISOR)
export class AdminConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Get()
    @ApiOperation({ summary: 'List all consultations (admin)' })
    @ApiResponse({ status: 200, description: 'All consultations' })
    async getAll(@Query() query: QueryConsultationsDto) {
        return this.consultationsService.getAllConsultations(query);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update consultation status' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateConsultationStatusDto) {
        return this.consultationsService.updateConsultationStatus(id, dto);
    }

    @Put(':id/notes')
    @ApiOperation({ summary: 'Add post-consultation notes', description: 'Advisor adds session notes and follow-up items.' })
    @ApiResponse({ status: 200, description: 'Notes added' })
    async addNotes(@Param('id') id: string, @Body() dto: AddConsultationNotesDto) {
        return this.consultationsService.addNotes(id, dto);
    }
}
