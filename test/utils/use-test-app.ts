import type { AddressInfo } from 'node:net';
import type { ErrorStatuses } from '../../src/shared/http/http-error.filter.ts';
import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent.js';
import { AppModule, SHARED_MODULES } from '../../src/app/app.module.ts';
import { setupApp } from '../../src/app/app.setup.ts';
import { DbService } from '../../src/shared/db/db.service.ts';
import { LOG_SINK } from '../../src/shared/logging/event-logger.ts';
import { cleanDatabase } from './clean-database.ts';
import { CapturedLogs } from './log-sink.double.ts';

type Configure = (builder: TestingModuleBuilder) => TestingModuleBuilder;

export type TestApp = {
  http(): TestAgent;
  get<T>(token: Type<T> | symbol): T;
  logs: CapturedLogs;
};

const LOOPBACK = '127.0.0.1';

const startApp = async (
  builder: TestingModuleBuilder,
  logs: CapturedLogs,
  errorStatuses?: ErrorStatuses,
): Promise<{ app: INestApplication; url: string }> => {
  const moduleRef = await builder
    .overrideProvider(LOG_SINK)
    .useValue(logs)
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  setupApp(app, errorStatuses);
  // Listen once per file so the HTTP client never opens its own port.
  await app.listen(0, LOOPBACK);
  const address = app.getHttpServer().address() as AddressInfo;
  return { app, url: `http://${LOOPBACK}:${address.port}` };
};

const register = (
  createBuilder: () => TestingModuleBuilder,
  options: { cleanBeforeEach: boolean; errorStatuses?: ErrorStatuses },
): TestApp => {
  const logs = new CapturedLogs();
  let started: { app: INestApplication; url: string } | null = null;

  const current = (): { app: INestApplication; url: string } => {
    if (started === null) {
      throw new Error('Test app is not started yet');
    }
    return started;
  };

  beforeAll(async () => {
    started = await startApp(createBuilder(), logs, options.errorStatuses);
  });

  beforeEach(async () => {
    if (options.cleanBeforeEach) {
      await cleanDatabase(current().app.get(DbService));
    }
    logs.clear();
  });

  afterAll(async () => {
    await started?.app.close();
  });

  return {
    http: () => request(current().url),
    get: <T>(token: Type<T> | symbol): T => current().app.get<T>(token),
    logs,
  };
};

export const useTestApp = (configure: Configure = (b) => b): TestApp =>
  register(
    () => configure(Test.createTestingModule({ imports: [AppModule] })),
    { cleanBeforeEach: true },
  );

export const createProbeApp = (metadata: {
  controllers?: Type[];
  imports?: Type[];
  errorStatuses?: ErrorStatuses;
}): TestApp =>
  register(
    () =>
      Test.createTestingModule({
        imports: [...SHARED_MODULES, ...(metadata.imports ?? [])],
        controllers: metadata.controllers ?? [],
      }),
    { cleanBeforeEach: false, errorStatuses: metadata.errorStatuses },
  );
