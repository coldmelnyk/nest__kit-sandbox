import { Global, Injectable, Module } from '@nestjs/common';
import { loadEnvFiles } from './load-env.ts';
import { parseConfig } from './config.schema.ts';
import type { AppConfig } from './config.schema.ts';

@Injectable()
export class ConfigService {
  private readonly _config: AppConfig;

  constructor() {
    this._config = parseConfig(loadEnvFiles());
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this._config[key];
  }
}

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
