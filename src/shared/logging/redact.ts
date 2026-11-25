const MAX_DEPTH = 8;
const REDACTED = '[redacted]';
const SECRET_NAME_PARTS = [
  'password',
  'secret',
  'salt',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
] as const;
const SECRET_NAME_SUFFIX = 'token';

const isSecretName = (name: string): boolean => {
  const lower = name.toLowerCase();
  return (
    SECRET_NAME_PARTS.some((part) => lower.includes(part)) ||
    lower.endsWith(SECRET_NAME_SUFFIX)
  );
};

const redactValue = (value: unknown, depth: number): unknown => {
  if (depth > MAX_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactValue(item, depth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = isSecretName(key) ? REDACTED : redactValue(item, depth + 1);
  }
  return result;
};

export const redact = (
  fields: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(fields)) {
    result[key] = isSecretName(key) ? REDACTED : redactValue(item, 2);
  }
  return result;
};
