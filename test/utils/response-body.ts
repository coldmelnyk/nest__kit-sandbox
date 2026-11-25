import type { Response } from 'supertest';

type Options = { allow?: string[] };

const SECRET_NAME =
  /password|secret|salt|api_?key|authorization|cookie|token$/i;
const JWT = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/;
const STORAGE_ADDRESS = /(postgres(ql)?|redis|s3|mongodb):\/\//i;

const findLeaks = (
  value: unknown,
  path: string,
  allow: Set<string>,
): string[] => {
  if (typeof value === 'string') {
    return JWT.test(value) || STORAGE_ADDRESS.test(value) ? [path] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index) =>
      findLeaks(item, `${path}[${index}]`, allow),
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => {
      const itemPath = path === '' ? key : `${path}.${key}`;
      const own =
        SECRET_NAME.test(key) && !allow.has(itemPath) ? [itemPath] : [];
      return [...own, ...findLeaks(item, itemPath, allow)];
    });
  }
  return [];
};

export const responseBody = <T = unknown>(
  response: Response,
  options: Options = {},
): T => {
  const body: unknown = response.body;
  const leaks = findLeaks(body, '', new Set(options.allow ?? []));
  if (leaks.length > 0) {
    throw new Error(`Response body exposes secrets at: ${leaks.join(', ')}`);
  }
  return body as T;
};
