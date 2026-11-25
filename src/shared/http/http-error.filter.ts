import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import type { EventLogger } from '../logging/event-logger.ts';
import type { ErrorResponse } from './error-response.ts';

const INTERNAL_ERROR = 'INTERNAL_ERROR';
const INTERNAL_MESSAGE = 'Internal server error';
const TOO_MANY_REQUESTS = 429;
const STACK_FRAME = /^\s+at /;

export type ErrorStatuses = Readonly<Record<string, number>>;

type Outcome = { status: number; body: Omit<ErrorResponse, 'requestId'> };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const stringField = (value: unknown, key: string): string | null => {
  if (!isRecord(value)) {
    return null;
  }
  const field = value[key];
  return typeof field === 'string' ? field : null;
};

const detailsOf = (value: unknown): Record<string, unknown> | null =>
  isRecord(value) && isRecord(value.details) ? value.details : null;

// The first stack line repeats the message, and libraries put call arguments there.
const framesOnly = (error: Error): string | null => {
  if (error.stack === undefined) {
    return null;
  }
  return error.stack
    .split('\n')
    .filter((line) => STACK_FRAME.test(line))
    .join('\n');
};

const statusName = (status: number): string => {
  const name: unknown = HttpStatus[status];
  return typeof name === 'string' ? name : INTERNAL_ERROR;
};

const withDetails = (
  code: string,
  message: string,
  details: Record<string, unknown> | null,
): Outcome['body'] =>
  details === null ? { code, message } : { code, message, details };

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  constructor(
    private readonly _statuses: ErrorStatuses,
    private readonly _events: EventLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.outcome(exception);
    const details = body.details;
    if (
      status === TOO_MANY_REQUESTS &&
      details !== undefined &&
      typeof details.retryAfterSeconds === 'number'
    ) {
      response.setHeader('Retry-After', String(details.retryAfterSeconds));
    }
    const payload: ErrorResponse = {
      ...body,
      requestId: this._events.requestId() ?? '',
    };
    response.status(status).json(payload);
  }

  private outcome(exception: unknown): Outcome {
    const domainCode = stringField(exception, 'code');
    if (
      exception instanceof Error &&
      !(exception instanceof HttpException) &&
      domainCode !== null &&
      Object.hasOwn(this._statuses, domainCode)
    ) {
      return {
        status: this._statuses[domainCode],
        body: withDetails(domainCode, exception.message, detailsOf(exception)),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const code = stringField(response, 'code');
      if (code !== null) {
        const message = stringField(response, 'message') ?? exception.message;
        return {
          status,
          body: withDetails(code, message, detailsOf(response)),
        };
      }
      return {
        status,
        body: { code: statusName(status), message: exception.message },
      };
    }
    this._events.error('http.unhandled_error', {
      errorType:
        exception instanceof Error
          ? exception.constructor.name
          : typeof exception,
      code: domainCode,
      stack: exception instanceof Error ? framesOnly(exception) : null,
    });
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: INTERNAL_ERROR, message: INTERNAL_MESSAGE },
    };
  }
}
