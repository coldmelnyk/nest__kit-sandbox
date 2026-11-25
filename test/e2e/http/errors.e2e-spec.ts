import { isUuid } from '../../../src/shared/ids/ids.ts';
import type { ErrorResponse } from '../../../src/shared/http/error-response.ts';
import { responseBody } from '../../utils/response-body.ts';
import { createProbeApp } from '../../utils/use-test-app.ts';
import {
  ClosedController,
  PROBE_ERROR_STATUSES,
  ProbeController,
} from './probe.controller.ts';

const app = createProbeApp({
  controllers: [ProbeController, ClosedController],
  errorStatuses: PROBE_ERROR_STATUSES,
});

const VALID_ITEM = {
  title: 'Demo',
  quantity: 1,
  owner: { email: 'demo@example.com' },
};
const ONE_MB = 1024 * 1024;

describe('error filter', () => {
  it('maps a domain error from the registry to its status and code', async () => {
    const response = await app.http().get('/api/v1/probe/rejected');
    expect(response.status).toBe(409);
    expect(responseBody<ErrorResponse>(response)).toEqual({
      code: 'PROBE_REJECTED',
      message: 'Probe rejected',
      details: { itemId: 'item-1' },
      requestId: response.headers['x-request-id'],
    });
  });

  it('sends a domain code missing from the registry as 500 without details', async () => {
    const response = await app.http().get('/api/v1/probe/fault');
    expect(response.status).toBe(500);
    expect(responseBody<ErrorResponse>(response)).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId: response.headers['x-request-id'],
    });
  });

  it('sends any other error as 500 INTERNAL_ERROR', async () => {
    const response = await app.http().get('/api/v1/probe/crash');
    expect(response.status).toBe(500);
    expect(responseBody<ErrorResponse>(response).code).toBe('INTERNAL_ERROR');
  });

  it('takes the code from an HTTP exception body and sets Retry-After for 429', async () => {
    const response = await app.http().get('/api/v1/probe/coded-http');
    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBe('30');
    expect(responseBody<ErrorResponse>(response)).toMatchObject({
      code: 'PROBE_RATE_LIMITED',
      details: { retryAfterSeconds: 30 },
    });
  });

  it('names the status for a plain HTTP exception and an unknown route', async () => {
    const thrown = await app.http().get('/api/v1/probe/plain-http');
    expect(thrown.status).toBe(404);
    expect(responseBody<ErrorResponse>(thrown).code).toBe('NOT_FOUND');

    const missing = await app.http().get('/api/v1/nowhere');
    expect(missing.status).toBe(404);
    expect(responseBody<ErrorResponse>(missing).code).toBe('NOT_FOUND');
  });

  it('names the status for a body that cannot be parsed', async () => {
    const malformed = await app
      .http()
      .post('/api/v1/probe/items')
      .set('Content-Type', 'application/json')
      .send('{"title":');
    expect(malformed.status).toBe(400);
    expect(responseBody<ErrorResponse>(malformed).code).toBe('BAD_REQUEST');

    const tooLarge = await app
      .http()
      .post('/api/v1/probe/items')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ title: 'x'.repeat(ONE_MB) }));
    expect(tooLarge.status).toBe(413);
    expect(responseBody<ErrorResponse>(tooLarge).code).toBe(
      'PAYLOAD_TOO_LARGE',
    );
  });

  it('reports validation failures with field paths and rules', async () => {
    const response = await app
      .http()
      .post('/api/v1/probe/items')
      .send({ title: 5, quantity: 0, owner: { email: 7 } });
    expect(response.status).toBe(400);
    const body = responseBody<ErrorResponse>(response);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details).toEqual({
      fields: [
        { path: 'title', rules: ['isString'] },
        { path: 'quantity', rules: ['min'] },
        { path: 'owner.email', rules: ['isString'] },
      ],
    });
  });

  it('drops fields the request DTO does not declare', async () => {
    const response = await app
      .http()
      .post('/api/v1/probe/items')
      .send({ ...VALID_ITEM, extra: 'dropped' });
    expect(response.status).toBe(201);
    expect(responseBody(response)).toEqual({ title: 'Demo' });
  });

  it('refuses an endpoint without @Public()', async () => {
    const response = await app.http().get('/api/v1/closed');
    expect(response.status).toBe(401);
    expect(responseBody<ErrorResponse>(response).code).toBe('UNAUTHORIZED');
  });

  it('returns the same request id in the header and the body', async () => {
    const response = await app.http().get('/api/v1/probe/plain-http');
    const header = response.headers['x-request-id'];
    expect(typeof header === 'string' && isUuid(header)).toBe(true);
    expect(responseBody<ErrorResponse>(response).requestId).toBe(header);
  });
});
