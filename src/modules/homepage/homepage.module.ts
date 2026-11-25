import { Module } from '@nestjs/common';
import { HomepageContentService } from './application/services/homepage-content.service.ts';
import { PrismaHomepageContentRepository } from './infrastructure/prisma/prisma-homepage-content.repository.ts';
import { HomepageContentRepository } from './ports/homepage-content.repository.ts';
import { HomepageController } from './presentation/homepage.controller.ts';

@Module({
  controllers: [HomepageController],
  providers: [
    HomepageContentService,
    {
      provide: HomepageContentRepository,
      useClass: PrismaHomepageContentRepository,
    },
  ],
})
export class HomepageModule {}
