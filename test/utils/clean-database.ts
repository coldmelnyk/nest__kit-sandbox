import { inject } from 'vitest';
import type { DbService } from '../../src/shared/db/db.service.ts';

export type TableSnapshot = { name: string; rowsJson: string | null };

declare module 'vitest' {
  interface ProvidedContext {
    migrationData: TableSnapshot[];
  }
}

// Returns the database to the state right after migrations: every table is
// emptied, then the rows the migrations inserted are put back.
export const cleanDatabase = async (db: DbService): Promise<void> => {
  if (process.env.NODE_ENV !== 'e2e') {
    throw new Error('cleanDatabase runs only with NODE_ENV=e2e');
  }
  const snapshots = inject('migrationData');
  if (snapshots.length === 0) {
    return;
  }
  // Names come from the catalog already quoted by format('%I').
  await db.$executeRawUnsafe(
    `TRUNCATE ${snapshots.map((table) => table.name).join(', ')} CASCADE`,
  );
  for (const { name, rowsJson } of snapshots) {
    if (rowsJson !== null) {
      await db.$executeRawUnsafe(
        `INSERT INTO ${name} SELECT * FROM json_populate_recordset(NULL::${name}, $1::json)`,
        rowsJson,
      );
    }
  }
};
