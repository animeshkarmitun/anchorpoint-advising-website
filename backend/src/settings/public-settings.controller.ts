import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SettingsService } from './settings.service';

/**
 * Public settings endpoint — tells the frontend what registration mode is active.
 */
@ApiTags('Public')
@Controller('public/settings')
export class PublicSettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('registration-mode')
    @Public()
    @ApiOperation({
        summary: 'Get current registration mode (public)',
        description:
            'Returns the registration mode so the frontend can show/hide the Register button. ' +
            'OPEN = register button visible, INVITE_ONLY = hidden (use invite link), DISABLED = hidden.',
    })
    @ApiResponse({
        status: 200,
        description: 'Current registration mode',
        schema: {
            example: {
                success: true,
                message: 'Registration mode',
                data: {
                    mode: 'OPEN',
                    registrationEnabled: true,
                },
            },
        },
    })
    async getRegistrationMode() {
        const mode = await this.settingsService.getRegistrationMode();

        return {
            success: true,
            message: 'Registration mode',
            data: {
                mode,
                registrationEnabled: mode === 'OPEN',
            },
        };
    }
}
