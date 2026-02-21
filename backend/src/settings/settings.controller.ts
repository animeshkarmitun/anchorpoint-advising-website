import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
    UpdateRegistrationModeDto,
    GenerateInviteDto,
    UpdateSettingDto,
} from './dto/settings.dto';

@ApiTags('Admin: Settings')
@ApiBearerAuth('JWT-auth')
@Controller('admin/settings')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    // ─── Registration Gate (FR-SYS-005) ────────────────

    @Get('registration')
    @ApiOperation({
        summary: 'Get registration mode',
        description: 'Returns the current registration mode (OPEN, INVITE_ONLY, DISABLED) and active invites.',
    })
    @ApiResponse({ status: 200, description: 'Registration settings' })
    async getRegistrationSettings() {
        return this.settingsService.getRegistrationSettings();
    }

    @Put('registration/mode')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'Update registration mode',
        description:
            'Switch registration between OPEN, INVITE_ONLY, or DISABLED. Logged in AuditLog. [SUPER_ADMIN only]',
    })
    @ApiResponse({ status: 200, description: 'Mode updated' })
    @ApiResponse({ status: 403, description: 'Forbidden — SUPER_ADMIN only' })
    async updateRegistrationMode(
        @Body() dto: UpdateRegistrationModeDto,
        @CurrentUser('id') userId: string,
        @Req() req: any,
    ) {
        return this.settingsService.updateRegistrationMode(dto, userId, req.ip);
    }

    @Post('registration/invites')
    @ApiOperation({
        summary: 'Generate invite token',
        description: 'Creates a new invite link for INVITE_ONLY mode. Configure max uses and expiry.',
    })
    @ApiResponse({ status: 201, description: 'Invite token generated' })
    async generateInvite(
        @Body() dto: GenerateInviteDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.settingsService.generateInviteToken(dto, userId);
    }

    @Get('registration/invites')
    @ApiOperation({
        summary: 'List all invite tokens',
        description: 'Returns all invite tokens with usage stats and status.',
    })
    @ApiResponse({ status: 200, description: 'List of invite tokens' })
    async listInvites() {
        return this.settingsService.listInviteTokens();
    }

    @Delete('registration/invites/:id')
    @ApiOperation({
        summary: 'Revoke invite token',
        description: 'Deactivates a specific invite token.',
    })
    @ApiResponse({ status: 200, description: 'Invite revoked' })
    async revokeInvite(@Param('id') id: string) {
        return this.settingsService.revokeInviteToken(id);
    }

    // ─── General Settings ──────────────────────────────

    @Get()
    @ApiOperation({
        summary: 'Get all system settings',
        description: 'Returns all key-value system settings.',
    })
    @ApiResponse({ status: 200, description: 'All settings' })
    async getAllSettings() {
        return this.settingsService.getAllSettings();
    }

    @Put(':key')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'Update a system setting',
        description: 'Update a specific setting by key. [SUPER_ADMIN only]',
    })
    @ApiResponse({ status: 200, description: 'Setting updated' })
    async updateSetting(
        @Param('key') key: string,
        @Body() dto: UpdateSettingDto,
        @CurrentUser('id') userId: string,
        @Req() req: any,
    ) {
        return this.settingsService.updateSetting(key, dto, userId, req.ip);
    }
}
