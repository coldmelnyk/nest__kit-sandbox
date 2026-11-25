import { isUuidV7 } from '../../../src/shared/ids/ids.ts';
import type { ErrorResponse } from '../../../src/shared/http/error-response.ts';
import { responseBody } from '../../utils/response-body.ts';
import { createProbeApp } from '../../utils/use-test-app.ts';
import { ProbeController } from '../http/probe.controller.ts';

const app = createProbeApp({ controllers: [ProbeController] });

const CLIENT_REQUEST_ID = '0193a4b2-5c6d-7e8f-9a0b-1c2d3e4f5a6b';

describe('request log', () => {
  it('writes one http.request record with the route template and no request data', async () => {
    await app
      .http()
      .get('/api/v1/probe/items/item-42?email=demo@example.com')
      .set('Authorization', 'Bearer e2e-secret-not-a-real-key');

    const records = app.logs.ofEvent('http.request');
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      method: 'GET',
      route: '/api/v1/probe/items/:itemId',
      status: 200,
      userId: null,
    });
    expect(typeof records[0].durationMs).toBe('number');
    const text = JSON.stringify(app.logs.all());
    expect(text).not.toContain('item-42');
    expect(text).not.toContain('demo@example.com');
    expect(text).not.toContain('e2e-secret-not-a-real-key');
  });

  it('accepts a client X-Request-Id that is a UUID', async () => {
    const response = await app
      .http()
      .get('/api/v1/probe/plain-http')
      .set('X-Request-Id', CLIENT_REQUEST_ID);

    expect(response.headers['x-request-id']).toBe(CLIENT_REQUEST_ID);
    expect(responseBody<ErrorResponse>(response).requestId).toBe(
      CLIENT_REQUEST_ID,
    );
    expect(app.logs.ofEvent('http.request')[0].requestId).toBe(
      CLIENT_REQUEST_ID,
    );
  });

  it('replaces an X-Request-Id that is not a UUID', async () => {
    const response = await app
      .http()
      .get('/api/v1/probe/items/item-1')
      .set('X-Request-Id', 'not-a-uuid');

    const issued = response.headers['x-request-id'];
    expect(typeof issued === 'string' && isUuidV7(issued)).toBe(true);
    expect(app.logs.ofEvent('http.request')[0].requestId).toBe(issued);
  });

  it('logs a 500 with type and stack but without the error message', async () => {
    const response = await app.http().get('/api/v1/probe/crash');

    const [record] = app.logs.ofEvent('http.unhandled_error');
    expect(record).toMatchObject({
      level: 50,
      errorType: 'TypeError',
      code: null,
      requestId: response.headers['x-request-id'],
    });
    expect(JSON.stringify(app.logs.all())).not.toContain(
      'e2e-secret-not-a-real-key',
    );
  });
});
