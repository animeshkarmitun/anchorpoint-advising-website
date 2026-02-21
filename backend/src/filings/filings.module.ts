import { Module } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { FilingsController } from './filings.controller';
import { AdminFilingsController } from './admin-filings.controller';

@Module({
    controllers: [FilingsController, AdminFilingsController],
    providers: [FilingsService],
    exports: [FilingsService],
})
export class FilingsModule { }
