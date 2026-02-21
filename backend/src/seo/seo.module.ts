import { Module } from '@nestjs/common';
import { SeoService } from './seo.service';
import { SeoPublicController } from './seo-public.controller';
import { AdminSeoController } from './admin-seo.controller';

@Module({
    controllers: [SeoPublicController, AdminSeoController],
    providers: [SeoService],
    exports: [SeoService],
})
export class SeoModule { }
