import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════
//  Password hashes (bcrypt 10 rounds)
//  ⚠️  Change ALL passwords immediately in production!
// ═══════════════════════════════════════════════════════════

const HASHES = {
    // AnchorAdmin@2026
    superAdmin: '$2b$10$NfyUjfk.xGPBWq6Xiv6BX./TPAQjeSReidU3Nh9ap/O.guNZXy44e',
    // Advisor@2026
    advisor: '$2b$10$lt1LXqeeOE5Ww0ZpI5TvhO.ntes0afRdf1H7GQR6hchbu915kgSfS',
    // OpsTeam@2026
    operations: '$2b$10$DQjXASjvzkIhaiKofbYKk.7tU995yasCMa2MXl8mQ8iCWy0OspTE.',
    // Support@2026
    support: '$2b$10$mY8r8IHX2nEl5q8Ot9vyVe5Ff.Wh3ziFhBe.kN7v9g6aXyJUx7yGG',
    // Customer@2026
    customer: '$2b$10$GUR2IP.tZq7SlfMd7FZ2iOvmoPYvhZemwnsFSNpGMYx6TMQHsiCEO',
};

async function main() {
    console.log('🌱 Seeding database...\n');

    // ═══════════════════════════════════════════════════════
    //  1. System Settings
    // ═══════════════════════════════════════════════════════

    const settings = [
        { key: 'registration_mode', value: JSON.stringify('OPEN') },
        { key: 'company_name', value: JSON.stringify('Anchor Point Advising') },
        { key: 'company_name_bn', value: JSON.stringify('অ্যাঙ্কর পয়েন্ট অ্যাডভাইজিং') },
        { key: 'company_email', value: JSON.stringify('info@anchorpointadvising.com') },
        { key: 'company_phone', value: JSON.stringify('+880-1234-567890') },
        { key: 'tax_season_start', value: JSON.stringify('2025-07-01') },
        { key: 'tax_season_end', value: JSON.stringify('2025-11-30') },
        { key: 'max_file_size_mb', value: JSON.stringify(10) },
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
        { key: 'maintenance_mode', value: JSON.stringify(false) },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log(`  ✅ System settings (${settings.length} entries)`);

    // ═══════════════════════════════════════════════════════
    //  2. Super Admin (one and only)
    // ═══════════════════════════════════════════════════════

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@anchorpoint.com' },
        update: {
            passwordHash: HASHES.superAdmin,
            status: 'ACTIVE',
        },
        create: {
            email: 'admin@anchorpoint.com',
            passwordHash: HASHES.superAdmin,
            role: 'SUPER_ADMIN',
            emailVerified: true,
            status: 'ACTIVE',
        },
    });
    console.log(`  ✅ Super Admin: admin@anchorpoint.com`);

    // ═══════════════════════════════════════════════════════
    //  3. Staff Accounts
    // ═══════════════════════════════════════════════════════

    // ── Tax Advisors ───────────────────────────────────────

    const advisor1 = await prisma.user.upsert({
        where: { email: 'rafiq.advisor@anchorpoint.com' },
        update: {
            passwordHash: HASHES.advisor,
            status: 'ACTIVE',
        },
        create: {
            email: 'rafiq.advisor@anchorpoint.com',
            passwordHash: HASHES.advisor,
            role: 'TAX_ADVISOR',
            emailVerified: true,
            status: 'ACTIVE',
        },
    });
    console.log(`  ✅ Tax Advisor: rafiq.advisor@anchorpoint.com`);

    const advisor2 = await prisma.user.upsert({
        where: { email: 'nusrat.advisor@anchorpoint.com' },
        update: {
            passwordHash: HASHES.advisor,
            status: 'ACTIVE',
        },
        create: {
            email: 'nusrat.advisor@anchorpoint.com',
            passwordHash: HASHES.advisor,
            role: 'TAX_ADVISOR',
            emailVerified: true,
            status: 'ACTIVE',
        },
    });
    console.log(`  ✅ Tax Advisor: nusrat.advisor@anchorpoint.com`);

    // ── Operations ─────────────────────────────────────────

    const opsUser = await prisma.user.upsert({
        where: { email: 'ops@anchorpoint.com' },
        update: {
            passwordHash: HASHES.operations,
            status: 'ACTIVE',
        },
        create: {
            email: 'ops@anchorpoint.com',
            passwordHash: HASHES.operations,
            role: 'OPERATIONS',
            emailVerified: true,
            status: 'ACTIVE',
        },
    });
    console.log(`  ✅ Operations: ops@anchorpoint.com`);

    // ── Support ────────────────────────────────────────────

    const supportUser = await prisma.user.upsert({
        where: { email: 'support@anchorpoint.com' },
        update: {
            passwordHash: HASHES.support,
            status: 'ACTIVE',
        },
        create: {
            email: 'support@anchorpoint.com',
            passwordHash: HASHES.support,
            role: 'SUPPORT',
            emailVerified: true,
            status: 'ACTIVE',
        },
    });
    console.log(`  ✅ Support: support@anchorpoint.com`);

    // ═══════════════════════════════════════════════════════
    //  4. Test Customers (with Profiles)
    // ═══════════════════════════════════════════════════════

    // ── Customer 1: Individual Taxpayer ────────────────────

    const customer1 = await prisma.user.upsert({
        where: { email: 'karim.customer@example.com' },
        update: {
            passwordHash: HASHES.customer,
            status: 'ACTIVE',
        },
        create: {
            email: 'karim.customer@example.com',
            phone: '+8801711000001',
            passwordHash: HASHES.customer,
            role: 'CUSTOMER',
            emailVerified: true,
            phoneVerified: true,
            status: 'ACTIVE',
            profile: {
                create: {
                    fullName: 'Abdul Karim',
                    fullNameBn: 'আব্দুল করিম',
                    nid: '1990123456789',
                    tin: '123456789012',
                    dateOfBirth: new Date('1990-03-15'),
                    address: '42/A Dhanmondi, Road 8',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    taxZone: 'Dhaka-1',
                    taxCircle: 'Circle-105',
                    taxpayerCategory: 'INDIVIDUAL',
                    incomeSources: ['SALARY', 'INVESTMENT'],
                    employerName: 'Grameenphone Limited',
                    language: 'en',
                    onboardingDone: true,
                },
            },
        },
    });
    console.log(`  ✅ Customer: karim.customer@example.com (Individual, salaried)`);

    // ── Customer 2: Business Owner ────────────────────────

    const customer2 = await prisma.user.upsert({
        where: { email: 'fatima.customer@example.com' },
        update: {
            passwordHash: HASHES.customer,
            status: 'ACTIVE',
        },
        create: {
            email: 'fatima.customer@example.com',
            phone: '+8801711000002',
            passwordHash: HASHES.customer,
            role: 'CUSTOMER',
            emailVerified: true,
            phoneVerified: true,
            status: 'ACTIVE',
            profile: {
                create: {
                    fullName: 'Fatima Begum',
                    fullNameBn: 'ফাতিমা বেগম',
                    nid: '1985567890123',
                    tin: '987654321098',
                    dateOfBirth: new Date('1985-08-22'),
                    address: '118 Gulshan Avenue',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    taxZone: 'Dhaka-3',
                    taxCircle: 'Circle-210',
                    taxpayerCategory: 'INDIVIDUAL',
                    incomeSources: ['BUSINESS', 'RENTAL'],
                    businessName: 'Fatima Textiles Ltd.',
                    tradeLicenseNo: 'TRAD-2020-0456',
                    language: 'bn',
                    onboardingDone: true,
                },
            },
        },
    });
    console.log(`  ✅ Customer: fatima.customer@example.com (Business owner)`);

    // ── Customer 3: Freelancer (onboarding incomplete) ─────

    const customer3 = await prisma.user.upsert({
        where: { email: 'tanvir.customer@example.com' },
        update: {
            passwordHash: HASHES.customer,
            status: 'ACTIVE',
        },
        create: {
            email: 'tanvir.customer@example.com',
            phone: '+8801711000003',
            passwordHash: HASHES.customer,
            role: 'CUSTOMER',
            emailVerified: true,
            phoneVerified: false,
            status: 'ACTIVE',
            profile: {
                create: {
                    fullName: 'Tanvir Hassan',
                    fullNameBn: 'তানভীর হাসান',
                    dateOfBirth: new Date('1995-12-01'),
                    address: '5/B Mirpur DOHS',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    taxpayerCategory: 'INDIVIDUAL',
                    incomeSources: ['FREELANCE'],
                    language: 'en',
                    onboardingDone: false,
                },
            },
        },
    });
    console.log(`  ✅ Customer: tanvir.customer@example.com (Freelancer, incomplete onboarding)`);

    // ── Customer 4: NRB (Non-Resident Bangladeshi) ────────

    const customer4 = await prisma.user.upsert({
        where: { email: 'rezaul.customer@example.com' },
        update: {
            passwordHash: HASHES.customer,
            status: 'ACTIVE',
        },
        create: {
            email: 'rezaul.customer@example.com',
            phone: '+8801711000004',
            passwordHash: HASHES.customer,
            role: 'CUSTOMER',
            emailVerified: true,
            phoneVerified: true,
            status: 'ACTIVE',
            profile: {
                create: {
                    fullName: 'Rezaul Karim',
                    fullNameBn: 'রেজাউল করিম',
                    nid: '1978234567890',
                    tin: '345678901234',
                    dateOfBirth: new Date('1978-06-10'),
                    address: '23 Marina Bay, Singapore',
                    district: 'Sylhet',
                    taxZone: 'Sylhet',
                    taxCircle: 'Circle-15',
                    taxpayerCategory: 'INDIVIDUAL',
                    incomeSources: ['SALARY', 'RENTAL', 'INVESTMENT'],
                    employerName: 'DBS Bank, Singapore',
                    language: 'en',
                    onboardingDone: true,
                    vip: true,
                },
            },
        },
    });
    console.log(`  ✅ Customer: rezaul.customer@example.com (NRB, VIP)`);

    // ── Customer 5: Inactive Account ──────────────────────

    const customer5 = await prisma.user.upsert({
        where: { email: 'shirin.customer@example.com' },
        update: {
            passwordHash: HASHES.customer,
            status: 'INACTIVE',
        },
        create: {
            email: 'shirin.customer@example.com',
            phone: '+8801711000005',
            passwordHash: HASHES.customer,
            role: 'CUSTOMER',
            emailVerified: false,
            phoneVerified: false,
            status: 'INACTIVE',
            profile: {
                create: {
                    fullName: 'Shirin Akter',
                    fullNameBn: 'শিরিন আক্তার',
                    taxpayerCategory: 'INDIVIDUAL',
                    incomeSources: ['SALARY'],
                    language: 'bn',
                    onboardingDone: false,
                },
            },
        },
    });
    console.log(`  ✅ Customer: shirin.customer@example.com (Inactive, unverified)`);

    // ═══════════════════════════════════════════════════════
    //  5. SEO Defaults
    // ═══════════════════════════════════════════════════════

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
    }
    console.log(`  ✅ SEO defaults (${seoDefaults.length} entries)`);

    // ═══════════════════════════════════════════════════════
    //  Done
    // ═══════════════════════════════════════════════════════

    console.log('\n✨ Seeding complete!');
    console.log('─────────────────────────────────────────');
    console.log('  Users created:');
    console.log('    1 × SUPER_ADMIN');
    console.log('    2 × TAX_ADVISOR');
    console.log('    1 × OPERATIONS');
    console.log('    1 × SUPPORT');
    console.log('    5 × CUSTOMER (with profiles)');
    console.log('─────────────────────────────────────────');
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
