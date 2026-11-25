import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { Client } from 'pg';
import type { TestProject } from 'vitest/node';
import type { TableSnapshot } from '../utils/clean-database.ts';

const require = createRequire(import.meta.url);

const MIGRATIONS_TABLE = '_prisma_migrations';
const E2E_DATABASE_MARK = 'e2e';

const withClient = async <T>(
  connectionString: string,
  work: (client: Client) => Promise<T>,
): Promise<T> => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
};

// Rows the migrations insert are part of the schema: cleanDatabase restores them.
const snapshotMigrationData = (databaseUrl: string): Promise<TableSnapshot[]> =>
  withClient(databaseUrl, async (client) => {
    const tables = await client.query<{ name: string }>(
      `SELECT format('%I.%I', schemaname, tablename) AS name
       FROM pg_tables
       WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
         AND tablename <> $1`,
      [MIGRATIONS_TABLE],
    );
    const snapshots: TableSnapshot[] = [];
    for (const { name } of tables.rows) {
      // Names come from the catalog already quoted by format('%I').
      const rows = await client.query<{ data: string | null }>(
        `SELECT json_agg(t)::text AS data FROM ${name} t`,
      );
      snapshots.push({ name, rowsJson: rows.rows[0].data });
    }
    return snapshots;
  });

// Each run gets its own fresh database next to the configured one: migrations
// apply to a clean database, parallel sessions do not share data, and the
// configured database is never written to.
const setup = async (project: TestProject): Promise<() => Promise<void>> => {
  const baseUrl = project.config.env.DATABASE_URL;
  if (baseUrl === undefined) {
    throw new Error('DATABASE_URL is not set for e2e');
  }
  const base = new URL(baseUrl);
  const baseName = base.pathname.slice(1);
  if (!baseName.includes(E2E_DATABASE_MARK)) {
    throw new Error(`e2e database name must contain "${E2E_DATABASE_MARK}"`);
  }
  const runName = `${baseName}_run_${process.pid}`;
  const runUrl = new URL(base);
  runUrl.pathname = `/${runName}`;

  await withClient(baseUrl, (client) =>
    client.query(`CREATE DATABASE "${runName}"`),
  );
  const dropRunDatabase = async (): Promise<void> => {
    await withClient(baseUrl, (client) =>
      client.query(`DROP DATABASE IF EXISTS "${runName}" WITH (FORCE)`),
    );
  };

  try {
    const prismaCli = require.resolve('prisma/build/index.js');
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...project.config.env,
        DATABASE_URL: runUrl.toString(),
      },
    });
    project.provide('databaseUrl', runUrl.toString());
    project.provide(
      'migrationData',
      await snapshotMigrationData(runUrl.toString()),
    );
  } catch (error) {
    await dropRunDatabase();
    throw error;
  }
  return dropRunDatabase;
};

export default setup;
