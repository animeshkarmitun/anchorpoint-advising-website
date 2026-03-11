import {
    Controller,
    Post,
    Body,
    Get,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ─── Register ────────────────────────────────────────

    @Post('register')
    @Public()
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({
        summary: 'Register a new customer account',
        description:
            'Creates a new customer account. Registration may be gated (see FR-AUTH-009): ' +
            'OPEN = anyone can register, INVITE_ONLY = requires inviteToken, ' +
            'DISABLED = registration closed.',
    })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        schema: {
            example: {
                success: true,
                message: 'Registration successful. Please verify your email.',
                data: {
                    user: {
                        id: 'clx...',
                        email: 'user@example.com',
                        role: 'CUSTOMER',
                        emailVerified: false,
                    },
                    accessToken: 'eyJ...',
                    refreshToken: 'eyJ...',
                    expiresIn: '15m',
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Registration is disabled or invite required' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // ─── Login ───────────────────────────────────────────

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({
        summary: 'Login with email and password',
        description:
            'Authenticates user and returns JWT access + refresh tokens. ' +
            'Access token expires in 15m, refresh token in 7d.',
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            example: {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: 'clx...',
                        email: 'user@example.com',
                        role: 'CUSTOMER',
                        emailVerified: true,
                        profile: {
                            fullName: 'Rahim Ahmed',
                            language: 'en',
                            onboardingDone: true,
                        },
                    },
                    accessToken: 'eyJ...',
                    refreshToken: 'eyJ...',
                    expiresIn: '15m',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 403, description: 'Account suspended or inactive' })
    @ApiResponse({ status: 429, description: 'Too many login attempts' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // ─── Refresh Token ─────────────────────────────────

    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refresh access token',
        description:
            'Exchange a valid refresh token for a new access + refresh token pair. ' +
            'The old refresh token is invalidated (rotation).',
    })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed',
        schema: {
            example: {
                success: true,
                message: 'Token refreshed',
                data: {
                    accessToken: 'eyJ...',
                    refreshToken: 'eyJ...',
                    expiresIn: '15m',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto);
    }

    // ─── Logout ────────────────────────────────────────

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Logout and invalidate refresh token',
        description: 'Invalidates the provided refresh token. The access token remains valid until expiry.',
    })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@Body() dto: RefreshTokenDto) {
        return this.authService.logout(dto.refreshToken);
    }

    // ─── Forgot Password ──────────────────────────────

    @Post('forgot-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 3 } })
    @ApiOperation({
        summary: 'Request password reset',
        description:
            'Sends a password reset link to the provided email. ' +
            'Always returns success to prevent email enumeration.',
    })
    @ApiResponse({
        status: 200,
        description: 'Reset link sent (if account exists)',
    })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    // ─── Reset Password ───────────────────────────────

    @Post('reset-password')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset password using token',
        description: 'Resets the password using the token received via email. Token is single-use and expires in 30 minutes.',
    })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    // ─── Change Password (authenticated) ──────────────

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Change password (authenticated)',
        description: 'Change the current user\'s password. Requires the current password for verification.',
    })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({ status: 401, description: 'Current password is incorrect' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(userId, dto);
    }

    // ─── Get Current User ─────────────────────────────

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Get current authenticated user',
        description: 'Returns the profile of the currently authenticated user.',
    })
    @ApiResponse({
        status: 200,
        description: 'Current user profile',
        schema: {
            example: {
                success: true,
                message: 'User profile',
                data: {
                    id: 'clx...',
                    email: 'user@example.com',
                    role: 'CUSTOMER',
                    emailVerified: true,
                    profile: {
                        fullName: 'Rahim Ahmed',
                        fullNameBn: 'রহিম আহমেদ',
                        language: 'en',
                        onboardingDone: true,
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.authService.getMe(userId);
    }
}
