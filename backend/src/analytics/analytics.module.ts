import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardController } from './dashboard.controller';
import { AuditLogController } from './audit-log.controller';
import { CustomersController } from './customers.controller';
import { StaffController } from './staff.controller';

@Module({
    controllers: [
        DashboardController,
        AuditLogController,
        CustomersController,
        StaffController,
    ],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
