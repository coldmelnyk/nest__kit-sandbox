import { inject } from 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    databaseUrl: string;
  }
}

// Points the workers at the database this run created in global setup.
process.env.DATABASE_URL = inject('databaseUrl');
