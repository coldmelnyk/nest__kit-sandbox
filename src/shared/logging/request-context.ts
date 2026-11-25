import { AsyncLocalStorage } from 'node:async_hooks';

type RequestContext = { requestId: string };

const storage = new AsyncLocalStorage<RequestContext>();

export const runInRequestContext = <T>(
  context: RequestContext,
  callback: () => T,
): T => storage.run(context, callback);

export const currentRequestId = (): string | null =>
  storage.getStore()?.requestId ?? null;
