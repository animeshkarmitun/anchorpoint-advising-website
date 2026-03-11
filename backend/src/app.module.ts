import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { ProfileModule } from './profile/profile.module';
import { DocumentsModule } from './documents/documents.module';
import { FilingsModule } from './filings/filings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { TicketsModule } from './tickets/tickets.module';
import { MessagesModule } from './messages/messages.module';
import { CmsModule } from './cms/cms.module';
import { SeoModule } from './seo/seo.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3012),
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        FRONTEND_URL: Joi.string().default('http://localhost:3011'),
        // S3 — all optional (local storage fallback)
        AWS_S3_BUCKET: Joi.string().optional().allow(''),
        AWS_S3_REGION: Joi.string().optional().allow(''),
        AWS_ACCESS_KEY_ID: Joi.string().optional().allow(''),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
        UPLOAD_DIR: Joi.string().default('./uploads'),
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
        REGISTRATION_MODE: Joi.string()
          .valid('OPEN', 'INVITE_ONLY', 'DISABLED')
          .default('OPEN'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // Serve uploaded files statically when using local storage
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const s3Bucket = config.get<string>('AWS_S3_BUCKET');
        if (s3Bucket) return []; // S3 mode — no static serving
        return [
          {
            rootPath: join(process.cwd(), config.get<string>('UPLOAD_DIR', './uploads')),
            serveRoot: '/uploads',
          },
        ];
      },
    }),

    // Core modules
    PrismaModule,
    UploadModule,
    AuthModule,
    SettingsModule,
    ProfileModule,
    DocumentsModule,
    FilingsModule,
    NotificationsModule,
    PaymentsModule,
    ConsultationsModule,
    TicketsModule,
    MessagesModule,
    CmsModule,
    SeoModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT auth guard (all routes require auth unless @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global RBAC guard (works with @Roles() decorator)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
