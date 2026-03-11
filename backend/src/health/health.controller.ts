import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Public')
@Public()
@Controller('health')
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Health check',
        description: 'Returns API health status including database connectivity and storage mode.',
    })
    @ApiResponse({
        status: 200,
        description: 'API is healthy',
        schema: {
            example: {
                success: true,
                message: 'API is healthy',
                data: {
                    status: 'ok',
                    timestamp: '2026-02-21T17:30:00.000Z',
                    version: '1.0.0',
                    database: 'connected',
                    storage: 'local',
                    uptime: 12345,
                },
            },
        },
    })
    async check() {
        let dbStatus = 'disconnected';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch {
            dbStatus = 'error';
        }

        return {
            success: true,
            message: 'API is healthy',
            data: {
                status: dbStatus === 'connected' ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                database: dbStatus,
                storage: this.uploadService.isS3Mode() ? 's3' : 'local',
                uptime: Math.floor(process.uptime()),
            },
        };
    }
}
