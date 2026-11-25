import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { pino } from 'pino';
import type { Logger } from 'pino';
import { ConfigService } from '../configs/config.service.ts';
import { redact } from './redact.ts';
import { currentRequestId } from './request-context.ts';
import type { LogEvents } from './log-events.ts';

export type LogSink = { write(line: string): void };

export const LOG_SINK = Symbol('LOG_SINK');

type EventName = keyof LogEvents;

@Injectable()
export class EventLogger {
  private readonly _logger: Logger;

  constructor(config: ConfigService, @Inject(LOG_SINK) sink: LogSink) {
    this._logger = pino(
      { level: config.get('LOG_LEVEL'), base: null, messageKey: 'event' },
      sink,
    );
  }

  requestId(): string | null {
    return currentRequestId();
  }

  debug<E extends EventName>(event: E, fields: LogEvents[E]): void {
    this._logger.debug(this.record(fields), event);
  }

  info<E extends EventName>(event: E, fields: LogEvents[E]): void {
    this._logger.info(this.record(fields), event);
  }

  warn<E extends EventName>(event: E, fields: LogEvents[E]): void {
    this._logger.warn(this.record(fields), event);
  }

  error<E extends EventName>(event: E, fields: LogEvents[E]): void {
    this._logger.error(this.record(fields), event);
  }

  private record(fields: LogEvents[EventName]): Record<string, unknown> {
    return { ...redact(fields), requestId: currentRequestId() };
  }
}

@Global()
@Module({
  providers: [EventLogger, { provide: LOG_SINK, useValue: process.stdout }],
  exports: [EventLogger],
})
export class LoggingModule {}
