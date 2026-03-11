import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

export class UpdateRegistrationModeDto {
    @ApiProperty({
        description: 'Registration mode',
        enum: ['OPEN', 'INVITE_ONLY', 'DISABLED'],
        example: 'OPEN',
    })
    @IsNotEmpty()
    @IsIn(['OPEN', 'INVITE_ONLY', 'DISABLED'])
    mode: 'OPEN' | 'INVITE_ONLY' | 'DISABLED';
}

export class GenerateInviteDto {
    @ApiPropertyOptional({
        description: 'Max number of times the invite can be used. Null = unlimited.',
        example: 5,
        minimum: 1,
        maximum: 1000,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000)
    maxUses?: number;

    @ApiPropertyOptional({
        description: 'Expiry in days (default: 7)',
        example: 7,
        minimum: 1,
        maximum: 90,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(90)
    expiryDays?: number = 7;
}

export class UpdateSettingDto {
    @ApiProperty({
        description: 'New value for the setting (JSON-compatible)',
        example: 'OPEN',
    })
    @IsNotEmpty()
    value: any;
}
