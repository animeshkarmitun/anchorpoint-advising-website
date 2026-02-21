import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MinLength,
    MaxLength,
} from 'class-validator';

// ─── Register ────────────────────────────────────────────

export class RegisterDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description:
            'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
        example: 'P@ssw0rd!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must include uppercase, lowercase, number, and special character',
        },
    )
    password: string;

    @ApiProperty({
        description: 'Full name of the user',
        example: 'Rahim Ahmed',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    fullName: string;

    @ApiPropertyOptional({
        description: 'Phone number (optional)',
        example: '+8801712345678',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description:
            'Invite token (required when registration mode is INVITE_ONLY)',
        example: 'abc123-invite-token',
    })
    @IsOptional()
    @IsString()
    inviteToken?: string;
}

// ─── Login ───────────────────────────────────────────────

export class LoginDto {
    @ApiProperty({
        description: 'Email address',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Password',
        example: 'P@ssw0rd!',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

// ─── Refresh Token ───────────────────────────────────────

export class RefreshTokenDto {
    @ApiProperty({
        description: 'The refresh token issued at login',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

// ─── Forgot Password ────────────────────────────────────

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'Email address to send reset link to',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

// ─── Reset Password ─────────────────────────────────────

export class ResetPasswordDto {
    @ApiProperty({
        description: 'The password reset token from the email link',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        description: 'New password',
        example: 'N3wP@ssw0rd!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must include uppercase, lowercase, number, and special character',
        },
    )
    newPassword: string;
}

// ─── Change Password ────────────────────────────────────

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Current password',
        example: 'OldP@ssw0rd!',
    })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({
        description: 'New password',
        example: 'N3wP@ssw0rd!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must include uppercase, lowercase, number, and special character',
        },
    )
    newPassword: string;
}

// ─── Email Verification ─────────────────────────────────

export class VerifyEmailDto {
    @ApiProperty({
        description: 'Email verification token',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}
