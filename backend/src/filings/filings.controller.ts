import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FilingsService } from './filings.service';
import { InitiateFilingDto, QueryFilingsDto } from './dto';

@ApiTags('Customer: Filings')
@ApiBearerAuth('JWT-auth')
@Controller('filings')
export class FilingsController {
    constructor(private readonly filingsService: FilingsService) { }

    @Post()
    @ApiOperation({
        summary: 'Initiate a new tax filing',
        description:
            'Start a new filing for an assessment year. Only one filing per assessment year per customer.',
    })
    @ApiResponse({ status: 201, description: 'Filing initiated' })
    @ApiResponse({ status: 409, description: 'Filing already exists for this year' })
    async initiateFiling(
        @CurrentUser('id') userId: string,
        @Body() dto: InitiateFilingDto,
    ) {
        return this.filingsService.initiateFiling(userId, dto);
    }

    @Get()
    @ApiOperation({
        summary: 'List my filings',
        description: 'List all filings for the authenticated customer.',
    })
    @ApiResponse({ status: 200, description: 'Filings list' })
    async getMyFilings(
        @CurrentUser('id') userId: string,
        @Query() query: QueryFilingsDto,
    ) {
        return this.filingsService.getMyFilings(userId, query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get filing details',
        description:
            'Get full filing details including documents, status history, progress bar, and days remaining.',
    })
    @ApiResponse({ status: 200, description: 'Filing details with progress' })
    async getFilingDetails(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.filingsService.getFilingDetails(userId, id);
    }
}
