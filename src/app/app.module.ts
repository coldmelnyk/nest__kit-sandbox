import { Module } from '@nestjs/common';
import { HomepageModule } from '../modules/homepage/index.ts';
import { ClockModule } from '../shared/clock/clock.ts';
import { ConfigModule } from '../shared/configs/config.service.ts';
import { DbModule } from '../shared/db/db.service.ts';
import { AccessModule } from '../shared/http/public.ts';
import { IdsModule } from '../shared/ids/ids.ts';
import { LoggingModule } from '../shared/logging/event-logger.ts';

export const SHARED_MODULES = [
  ConfigModule,
  ClockModule,
  IdsModule,
  LoggingModule,
  AccessModule,
  DbModule,
];

@Module({
  imports: [...SHARED_MODULES, HomepageModule],
})
export class AppModule {}
