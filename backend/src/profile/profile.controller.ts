import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/profile.dto';

@ApiTags('Customer: Profile')
@ApiBearerAuth('JWT-auth')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @ApiOperation({
        summary: 'Get my profile',
        description: 'Returns the full customer profile for the authenticated user.',
    })
    @ApiResponse({ status: 200, description: 'Customer profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser('id') userId: string) {
        return this.profileService.getProfile(userId);
    }

    @Put()
    @ApiOperation({
        summary: 'Update my profile',
        description:
            'Update customer profile fields. Sensitive fields (NID, TIN) are stored encrypted. ' +
            'Only provided fields are updated.',
    })
    @ApiResponse({ status: 200, description: 'Profile updated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.profileService.updateProfile(userId, dto);
    }
}
