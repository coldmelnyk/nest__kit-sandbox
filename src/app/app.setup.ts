import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpErrorFilter } from '../shared/http/http-error.filter.ts';
import type { ErrorStatuses } from '../shared/http/http-error.filter.ts';
import { requestTracking } from '../shared/http/request-tracking.ts';
import { createValidationPipe } from '../shared/http/validation.ts';
import { Ids } from '../shared/ids/ids.ts';
import { EventLogger } from '../shared/logging/event-logger.ts';
import { ERROR_STATUSES } from './error-statuses.ts';

const API_PREFIX = 'api/v1';
const DOCS_PATH = 'api/docs';

export const setupApp = (
  app: INestApplication,
  errorStatuses: ErrorStatuses = ERROR_STATUSES,
): void => {
  const events = app.get(EventLogger);
  app.use(requestTracking(app.get(Ids), events));
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpErrorFilter(errorStatuses, events));
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('kit-sandbox API').setVersion('1').build(),
  );
  SwaggerModule.setup(DOCS_PATH, app, document);
};
