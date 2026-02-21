import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { AdminConsultationsController } from './admin-consultations.controller';

@Module({
    controllers: [ConsultationsController, AdminConsultationsController],
    providers: [ConsultationsService],
    exports: [ConsultationsService],
})
export class ConsultationsModule { }
