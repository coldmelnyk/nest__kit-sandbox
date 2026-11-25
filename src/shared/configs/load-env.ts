import { existsSync } from 'node:fs';

// Repeated in prisma.config.ts: the image ships it without src/.
const ENV_FILES = {
  dev: ['.env.local', '.env.dev'],
  production: ['.env.production'],
  e2e: ['.env.e2e'],
} as const satisfies Record<string, readonly string[]>;

const isKnownEnv = (value: string): value is keyof typeof ENV_FILES =>
  Object.hasOwn(ENV_FILES, value);

// Files never override variables already set in the process: the first file
// that sets a variable wins, and the real environment beats every file.
export const loadEnvFiles = (): Record<string, string | undefined> => {
  const nodeEnv = process.env.NODE_ENV ?? 'dev';
  const files = isKnownEnv(nodeEnv) ? ENV_FILES[nodeEnv] : [];
  for (const file of files) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }
  return process.env;
};
