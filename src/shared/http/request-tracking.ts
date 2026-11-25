import type { NextFunction, Request, Response } from 'express';
import type { EventLogger } from '../logging/event-logger.ts';
import { runInRequestContext } from '../logging/request-context.ts';
import type { Ids } from '../ids/ids.ts';
import { isUuid } from '../ids/ids.ts';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const NS_PER_MS = 1_000_000n;

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

const routeTemplate = (req: Request): string | null => {
  const route: unknown = req.route;
  if (typeof route === 'object' && route !== null && 'path' in route) {
    return typeof route.path === 'string' ? route.path : null;
  }
  return null;
};

export const requestTracking = (ids: Ids, events: EventLogger): Middleware => {
  return (req, res, next) => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId =
      incoming !== undefined && isUuid(incoming) ? incoming : ids.next();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    // A monotonic clock measures duration; it is not a domain date, so Clock is not involved.
    const startedAt = process.hrtime.bigint();
    runInRequestContext({ requestId }, () => {
      res.on('finish', () => {
        events.info('http.request', {
          method: req.method,
          route: routeTemplate(req),
          status: res.statusCode,
          durationMs: Number((process.hrtime.bigint() - startedAt) / NS_PER_MS),
          userId: null,
        });
      });
      next();
    });
  };
};
