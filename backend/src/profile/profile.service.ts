import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                emailVerified: true,
                phoneVerified: true,
                lastLoginAt: true,
                createdAt: true,
                profile: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Mask sensitive fields
        const profile = user.profile;
        if (profile) {
            if (profile.nid) {
                (profile as any).nidMasked = profile.nid.replace(/.(?=.{4})/g, '*');
            }
            if (profile.tin) {
                (profile as any).tinMasked = profile.tin.replace(/.(?=.{4})/g, '*');
            }
        }

        return {
            success: true,
            message: 'Profile retrieved',
            data: user,
        };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        // Build update data (only provided fields)
        const updateData: any = {};
        const fieldsToUpdate = [
            'fullName',
            'fullNameBn',
            'nid',
            'tin',
            'address',
            'city',
            'district',
            'taxZone',
            'taxCircle',
            'employerName',
            'businessName',
            'tradeLicenseNo',
            'language',
            'notifyEmail',
            'notifySms',
        ];

        for (const field of fieldsToUpdate) {
            if (dto[field as keyof UpdateProfileDto] !== undefined) {
                updateData[field] = dto[field as keyof UpdateProfileDto];
            }
        }

        // Handle special fields
        if (dto.dateOfBirth !== undefined) {
            updateData.dateOfBirth = new Date(dto.dateOfBirth);
        }

        if (dto.taxpayerCategory !== undefined) {
            updateData.taxpayerCategory = dto.taxpayerCategory;
        }

        if (dto.incomeSources !== undefined) {
            updateData.incomeSources = dto.incomeSources;
        }

        const updated = await this.prisma.customerProfile.update({
            where: { userId },
            data: updateData,
        });

        return {
            success: true,
            message: 'Profile updated successfully',
            data: updated,
        };
    }
}
