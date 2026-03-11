import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // ─── System Settings ───────────────────────────────────
    const settings = [
        {
            key: 'registration_mode',
            value: JSON.stringify('OPEN'),
        },
        {
            key: 'company_name',
            value: JSON.stringify('Anchor Point Advising'),
        },
        {
            key: 'company_name_bn',
            value: JSON.stringify('অ্যাঙ্কর পয়েন্ট অ্যাডভাইজিং'),
        },
        {
            key: 'company_email',
            value: JSON.stringify('info@anchorpointadvising.com'),
        },
        {
            key: 'company_phone',
            value: JSON.stringify('+880-1234-567890'),
        },
        {
            key: 'tax_season_start',
            value: JSON.stringify('2025-07-01'),
        },
        {
            key: 'tax_season_end',
            value: JSON.stringify('2025-11-30'),
        },
        {
            key: 'max_file_size_mb',
            value: JSON.stringify(10),
        },
        {
            key: 'allowed_file_types',
            value: JSON.stringify([
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]),
        },
        {
            key: 'maintenance_mode',
            value: JSON.stringify(false),
        },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
        console.log(`  ✅ Setting: ${setting.key}`);
    }

    // ─── Super Admin User ──────────────────────────────────
    // Create a default super admin (password should be changed immediately)
    const adminEmail = 'admin@anchorpoint.com';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!existingAdmin) {
        // Using bcrypt hash of "AnchorAdmin@2026" 
        // In production, change this immediately
        const bcryptHash =
            '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36HG.PMR5dZ4a7Q0mz3Klf6';

        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: bcryptHash,
                role: 'SUPER_ADMIN',
                emailVerified: true,
                status: 'ACTIVE',
            },
        });
        console.log(`  ✅ Super Admin created: ${adminEmail}`);
    } else {
        console.log(`  ℹ️  Super Admin already exists: ${adminEmail}`);
    }

    // ─── SEO Defaults ──────────────────────────────────────
    const seoDefaults = [
        {
            page: 'home',
            locale: 'en',
            metaTitle: 'Anchor Point Advising — Professional Tax Services in Bangladesh',
            metaDescription:
                'Expert tax preparation, financial planning, and business consulting services. Simplify your tax filing with Anchor Point Advising.',
            ogTitle: 'Anchor Point Advising — Tax & Financial Advisory',
            ogDescription:
                'Professional tax services for individuals and businesses in Bangladesh.',
            robots: 'index, follow',
        },
        {
            page: 'home',
            locale: 'bn',
            metaTitle: 'অ্যাঙ্কর পয়েন্ট অ্যাডভাইজিং — বাংলাদেশে পেশাদার ট্যাক্স সেবা',
            metaDescription:
                'বিশেষজ্ঞ ট্যাক্স প্রস্তুতি, আর্থিক পরিকল্পনা এবং ব্যবসায়িক পরামর্শ সেবা।',
            ogTitle: 'অ্যাঙ্কর পয়েন্ট অ্যাডভাইজিং — ট্যাক্স ও আর্থিক পরামর্শ',
            ogDescription:
                'বাংলাদেশে ব্যক্তি ও ব্যবসার জন্য পেশাদার ট্যাক্স সেবা।',
            robots: 'index, follow',
        },
    ];

    for (const seo of seoDefaults) {
        await prisma.seoMeta.upsert({
            where: {
                page_locale: { page: seo.page, locale: seo.locale },
            },
            update: seo,
            create: seo,
        });
        console.log(`  ✅ SEO: ${seo.page} (${seo.locale})`);
    }

    console.log('\n✨ Seeding complete!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
