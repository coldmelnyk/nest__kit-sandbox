import { z } from 'zod';

export const NODE_ENVS = ['dev', 'production', 'e2e'] as const;
const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

// An empty string means "not set": without this, `PORT=` would coerce to 0.
const unsetIfEmpty = (value: unknown): unknown =>
  value === '' ? undefined : value;

const configSchema = z.object({
  NODE_ENV: z.preprocess(unsetIfEmpty, z.enum(NODE_ENVS).default('dev')),
  PORT: z.preprocess(
    unsetIfEmpty,
    z.coerce.number().int().min(MIN_PORT).max(MAX_PORT),
  ),
  DATABASE_URL: z.preprocess(
    unsetIfEmpty,
    z.url({ protocol: /^postgres(ql)?$/ }),
  ),
  LOG_LEVEL: z.preprocess(unsetIfEmpty, z.enum(LOG_LEVELS).default('info')),
});

export type AppConfig = z.infer<typeof configSchema>;
export type NodeEnv = AppConfig['NODE_ENV'];
export type LogLevel = AppConfig['LOG_LEVEL'];

export class ConfigError extends Error {
  constructor(readonly variables: string[]) {
    super(`Invalid configuration: ${variables.join(', ')}`);
    this.name = 'ConfigError';
  }
}

export const parseConfig = (
  env: Record<string, string | undefined>,
): AppConfig => {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    // Only variable names: values may be secrets.
    const names = result.error.issues.map((issue) => String(issue.path[0]));
    throw new ConfigError([...new Set(names)]);
  }
  return result.data;
};
