import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.ts';
import { setupApp } from './app/app.setup.ts';
import { ConfigService } from './shared/configs/config.service.ts';
import { EventLogger } from './shared/logging/event-logger.ts';

const bootstrap = async (): Promise<void> => {
  // The framework logger is off: all records go through EventLogger.
  const app = await NestFactory.create(AppModule, { logger: false });
  setupApp(app);
  const port = app.get(ConfigService).get('PORT');
  await app.listen(port);
  app.get(EventLogger).info('app.started', { port });
};

await bootstrap();
