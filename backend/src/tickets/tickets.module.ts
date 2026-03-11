import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AdminTicketsController } from './admin-tickets.controller';

@Module({
    controllers: [TicketsController, AdminTicketsController],
    providers: [TicketsService],
    exports: [TicketsService],
})
export class TicketsModule { }
