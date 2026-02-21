import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import {
    RegisterDto,
    LoginDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
} from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly BCRYPT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // ─── Register ────────────────────────────────────────

    async register(dto: RegisterDto) {
        // 1. Check registration mode (FR-AUTH-009)
        await this.checkRegistrationGate(dto.inviteToken);

        // 2. Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new ConflictException('An account with this email already exists');
        }

        // 3. Check phone uniqueness if provided
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new ConflictException('This phone number is already registered');
            }
        }

        // 4. Hash password
        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

        // 5. Generate email verification token
        const verificationToken = uuidv4();

        // 6. Create user + profile in a transaction
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    phone: dto.phone || null,
                    passwordHash,
                    role: 'CUSTOMER',
                    authProvider: 'EMAIL',
                },
            });

            await tx.customerProfile.create({
                data: {
                    userId: newUser.id,
                    fullName: dto.fullName,
                },
            });

            return newUser;
        });

        // 7. Consume invite token if applicable
        if (dto.inviteToken) {
            await this.consumeInviteToken(dto.inviteToken);
        }

        // 8. Generate tokens
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        this.logger.log(`New user registered: ${user.email}`);

        return {
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
                ...tokens,
                verificationToken, // In production, send this via email instead
            },
        };
    }

    // ─── Login ───────────────────────────────────────────

    async login(dto: LoginDto) {
        // 1. Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                profile: {
                    select: {
                        fullName: true,
                        fullNameBn: true,
                        language: true,
                        onboardingDone: true,
                    },
                },
            },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 2. Check account status
        if (user.status === 'SUSPENDED') {
            throw new ForbiddenException(
                'Your account has been suspended. Contact support.',
            );
        }
        if (user.status === 'INACTIVE') {
            throw new ForbiddenException(
                'Your account is inactive. Please contact us.',
            );
        }

        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // 4. Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // 5. Generate tokens
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        this.logger.log(`User logged in: ${user.email}`);

        return {
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    profile: user.profile,
                },
                ...tokens,
            },
        };
    }

    // ─── Refresh Token ─────────────────────────────────

    async refreshToken(dto: RefreshTokenDto) {
        // 1. Find the refresh token in DB
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 2. Check expiry
        if (storedToken.expiresAt < new Date()) {
            // Delete expired token
            await this.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw new UnauthorizedException('Refresh token expired');
        }

        // 3. Check user status
        if (storedToken.user.status !== 'ACTIVE') {
            throw new ForbiddenException('Account is not active');
        }

        // 4. Rotate: Delete old token, generate new pair
        await this.prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        const tokens = await this.generateTokens({
            sub: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });

        return {
            success: true,
            message: 'Token refreshed',
            data: tokens,
        };
    }

    // ─── Logout ────────────────────────────────────────

    async logout(refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });

        return {
            success: true,
            message: 'Logged out successfully',
            data: null,
        };
    }

    // ─── Forgot Password ──────────────────────────────

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        // Always return success (prevent email enumeration)
        if (!user) {
            return {
                success: true,
                message: 'If an account exists with this email, a reset link has been sent.',
                data: null,
            };
        }

        // Generate reset token (in production, send via email)
        const resetToken = uuidv4();

        // Store as a special refresh token (short expiry)
        await this.prisma.refreshToken.create({
            data: {
                token: `reset:${resetToken}`,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            },
        });

        this.logger.log(`Password reset requested for: ${user.email}`);

        return {
            success: true,
            message: 'If an account exists with this email, a reset link has been sent.',
            data: {
                // In production, remove this — send via email
                resetToken,
                expiresIn: '30 minutes',
            },
        };
    }

    // ─── Reset Password ───────────────────────────────

    async resetPassword(dto: ResetPasswordDto) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: `reset:${dto.token}` },
            include: { user: true },
        });

        if (!storedToken) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        if (storedToken.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw new BadRequestException('Reset token has expired');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

        // Update password and delete reset token
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: storedToken.user.id },
                data: { passwordHash },
            }),
            this.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            }),
            // Invalidate all existing refresh tokens for security
            this.prisma.refreshToken.deleteMany({
                where: { userId: storedToken.user.id },
            }),
        ]);

        this.logger.log(`Password reset completed for: ${storedToken.user.email}`);

        return {
            success: true,
            message: 'Password has been reset successfully. Please login with your new password.',
            data: null,
        };
    }

    // ─── Change Password (authenticated) ──────────────

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.passwordHash) {
            throw new BadRequestException('Cannot change password for this account');
        }

        // Verify current password
        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash and update
        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        this.logger.log(`Password changed for: ${user.email}`);

        return {
            success: true,
            message: 'Password changed successfully',
            data: null,
        };
    }

    // ─── Get current user profile ──────────────────────

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                emailVerified: true,
                phoneVerified: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            success: true,
            message: 'User profile',
            data: user,
        };
    }

    // ─── Registration Gate (FR-AUTH-009) ───────────────

    private async checkRegistrationGate(inviteToken?: string) {
        const modeSetting = await this.prisma.setting.findUnique({
            where: { key: 'registration_mode' },
        });

        const mode = modeSetting
            ? JSON.parse(modeSetting.value as string)
            : this.configService.get<string>('REGISTRATION_MODE', 'OPEN');

        switch (mode) {
            case 'DISABLED':
                throw new ForbiddenException(
                    'Registration is currently closed. Contact us for access.',
                );

            case 'INVITE_ONLY':
                if (!inviteToken) {
                    throw new ForbiddenException(
                        'Registration requires an invite token. Contact us for access.',
                    );
                }
                await this.validateInviteToken(inviteToken);
                break;

            case 'OPEN':
            default:
                break; // No restriction
        }
    }

    private async validateInviteToken(token: string) {
        const invite = await this.prisma.inviteToken.findUnique({
            where: { token },
        });

        if (!invite) {
            throw new BadRequestException('Invalid invite token');
        }

        if (!invite.active) {
            throw new BadRequestException('This invite has been revoked');
        }

        if (invite.expiresAt < new Date()) {
            throw new BadRequestException('This invite has expired');
        }

        if (invite.maxUses && invite.usedCount >= invite.maxUses) {
            throw new BadRequestException('This invite has reached its maximum uses');
        }
    }

    private async consumeInviteToken(token: string) {
        await this.prisma.inviteToken.update({
            where: { token },
            data: { usedCount: { increment: 1 } },
        });
    }

    // ─── Token Generation ─────────────────────────────

    private async generateTokens(payload: JwtPayload) {
        const tokenPayload = { sub: payload.sub, email: payload.email, role: payload.role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(tokenPayload as any, {
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
            }),
            this.jwtService.signAsync(tokenPayload as any, {
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
            }),
        ]);

        // Store refresh token in DB (for rotation + revocation)
        const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
        const expiresAt = new Date();
        const days = parseInt(refreshExpiry) || 7;
        expiresAt.setDate(expiresAt.getDate() + days);

        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: payload.sub,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        };
    }
}
