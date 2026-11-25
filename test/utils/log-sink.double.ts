import type { LogSink } from '../../src/shared/logging/event-logger.ts';

export type LogRecord = Record<string, unknown> & { event: string };

export class CapturedLogs implements LogSink {
  private _records: LogRecord[] = [];

  write(line: string): void {
    this._records.push(JSON.parse(line) as LogRecord);
  }

  all(): LogRecord[] {
    return [...this._records];
  }

  ofEvent(event: string): LogRecord[] {
    return this._records.filter((record) => record.event === event);
  }

  clear(): void {
    this._records = [];
  }
}
