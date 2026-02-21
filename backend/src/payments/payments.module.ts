import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
    controllers: [PaymentsController, AdminPaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }
