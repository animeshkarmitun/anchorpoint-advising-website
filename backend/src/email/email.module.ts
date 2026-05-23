import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * EmailModule — Global module providing the Brevo email integration.
 *
 * Marked as @Global so any module can inject EmailService
 * without explicitly importing EmailModule.
 */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
