import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsPublicController } from './cms-public.controller';
import { AdminCmsController } from './admin-cms.controller';

@Module({
    controllers: [CmsPublicController, AdminCmsController],
    providers: [CmsService],
    exports: [CmsService],
})
export class CmsModule { }
