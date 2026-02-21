import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security
  app.use(helmet());

  // Global interceptor (response envelope)
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3011'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger (non-production only)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Anchor Point Advising API')
      .setDescription(
        'Tax consulting & financial advisory platform API. ' +
        'All endpoints use /api/v1 prefix. ' +
        'Authentication via Bearer JWT token.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Registration, login, tokens, password reset')
      .addTag('Customer: Profile', 'Customer profile and settings')
      .addTag('Customer: Documents', 'Document upload and management')
      .addTag('Customer: Filings', 'Tax filing lifecycle')
      .addTag('Customer: Payments', 'Payments and invoices')
      .addTag('Customer: Consultations', 'Consultation booking')
      .addTag('Customer: Messages', 'In-app messaging')
      .addTag('Customer: Notifications', 'Notification center')
      .addTag('Customer: Tickets', 'Support tickets')
      .addTag('Admin: Dashboard', 'Admin KPIs and overview')
      .addTag('Admin: Customers', 'Customer management')
      .addTag('Admin: Staff', 'Staff/team management')
      .addTag('Admin: Documents', 'Document review queue')
      .addTag('Admin: Filings', 'Filing management')
      .addTag('Admin: Payments', 'Payment and refund management')
      .addTag('Admin: Consultations', 'Consultation management')
      .addTag('Admin: Messages', 'Message center')
      .addTag('Admin: Tickets', 'Ticket management')
      .addTag('Admin: CMS', 'Website content management')
      .addTag('Admin: SEO', 'SEO metadata management')
      .addTag('Admin: Analytics', 'Reports and analytics')
      .addTag('Admin: Settings', 'System configuration')
      .addTag('Public', 'Public content endpoints')
      .addServer(`http://localhost:${configService.get<number>('PORT', 3012)}`, 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        docExpansion: 'none',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Anchor Point API Docs',
    });
  }

  const port = configService.get<number>('PORT', 3012);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
