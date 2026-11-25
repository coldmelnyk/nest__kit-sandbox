import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Repeats src/shared/configs/load-env.ts and src/shared/db/session-options.ts:
// the image ships prisma.config.ts without src/. Change both places together.
const ENV_FILES = {
  dev: ['.env.local', '.env.dev'],
  production: ['.env.production'],
  e2e: ['.env.e2e'],
} as const;

const nodeEnv = process.env.NODE_ENV ?? 'dev';
const files: readonly string[] =
  nodeEnv in ENV_FILES ? ENV_FILES[nodeEnv as keyof typeof ENV_FILES] : [];
for (const file of files) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}

const withUtcSession = (databaseUrl: string): string => {
  const url = new URL(databaseUrl);
  const own = url.searchParams.get('options');
  const utc = '-c timezone=UTC';
  url.searchParams.set(
    'options',
    own === null || own === '' ? utc : `${own} ${utc}`,
  );
  return url.toString();
};

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      databaseUrl === undefined || databaseUrl === ''
        ? ''
        : withUtcSession(databaseUrl),
  },
});
