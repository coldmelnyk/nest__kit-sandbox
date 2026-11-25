import type { DbService } from '../../src/shared/db/db.service.ts';

const MIGRATIONS_TABLE = '_prisma_migrations';

export const cleanDatabase = async (db: DbService): Promise<void> => {
  if (process.env.NODE_ENV !== 'e2e') {
    throw new Error('cleanDatabase runs only with NODE_ENV=e2e');
  }
  const tables = await db.$queryRaw<{ name: string }[]>`
    SELECT format('%I.%I', schemaname, tablename) AS name
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND tablename <> ${MIGRATIONS_TABLE}`;
  if (tables.length === 0) {
    return;
  }
  // Names come from the catalog already quoted by format('%I').
  await db.$executeRawUnsafe(
    `TRUNCATE ${tables.map((table) => table.name).join(', ')} CASCADE`,
  );
};
