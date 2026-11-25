import { defineConfig } from 'vitest/config';

// Made-up values for tests. DATABASE_URL from the environment wins. Each run
// creates its own database next to this one (test/setup/migrate.ts).
const E2E_DATABASE_URL =
  'postgresql://kit:local-dev-not-a-secret@localhost:5432/kit_sandbox_e2e';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    // e2e files share one database.
    fileParallelism: false,
    globalSetup: ['test/setup/migrate.ts'],
    setupFiles: ['test/setup/database-url.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'e2e',
      PORT: '3999',
      DATABASE_URL: process.env.DATABASE_URL ?? E2E_DATABASE_URL,
      LOG_LEVEL: 'info',
    },
  },
});
