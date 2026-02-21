import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsBoolean,
    IsIn,
    MaxLength,
    IsArray,
} from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        description: 'Full name',
        example: 'Rahim Ahmed',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

    @ApiPropertyOptional({
        description: 'Full name in Bangla',
        example: 'রহিম আহমেদ',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullNameBn?: string;

    @ApiPropertyOptional({
        description: 'National ID number',
        example: '1234567890123',
    })
    @IsOptional()
    @IsString()
    nid?: string;

    @ApiPropertyOptional({
        description: 'Tax Identification Number',
        example: '123456789012',
    })
    @IsOptional()
    @IsString()
    tin?: string;

    @ApiPropertyOptional({
        description: 'Date of birth (ISO 8601)',
        example: '1990-05-15',
    })
    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ example: 'Mirpur-10, Dhaka' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 'Dhaka' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'Dhaka' })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({ example: 'Dhaka-1' })
    @IsOptional()
    @IsString()
    taxZone?: string;

    @ApiPropertyOptional({ example: 'Circle-23' })
    @IsOptional()
    @IsString()
    taxCircle?: string;

    @ApiPropertyOptional({
        description: 'Taxpayer category',
        enum: ['INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'OTHER'],
        example: 'INDIVIDUAL',
    })
    @IsOptional()
    @IsIn(['INDIVIDUAL', 'COMPANY', 'PARTNERSHIP', 'OTHER'])
    taxpayerCategory?: string;

    @ApiPropertyOptional({
        description: 'Income sources',
        example: ['SALARY', 'RENTAL'],
        enum: ['SALARY', 'BUSINESS', 'FREELANCE', 'RENTAL', 'INVESTMENT', 'OTHER'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    incomeSources?: string[];

    @ApiPropertyOptional({ example: 'XYZ Corp Ltd' })
    @IsOptional()
    @IsString()
    employerName?: string;

    @ApiPropertyOptional({ example: 'Ahmed Trading' })
    @IsOptional()
    @IsString()
    businessName?: string;

    @ApiPropertyOptional({ example: 'TL-2025-12345' })
    @IsOptional()
    @IsString()
    tradeLicenseNo?: string;

    @ApiPropertyOptional({
        description: 'Preferred language',
        enum: ['en', 'bn'],
        example: 'en',
    })
    @IsOptional()
    @IsIn(['en', 'bn'])
    language?: string;

    @ApiPropertyOptional({
        description: 'Receive email notifications',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    notifyEmail?: boolean;

    @ApiPropertyOptional({
        description: 'Receive SMS notifications',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    notifySms?: boolean;
}
