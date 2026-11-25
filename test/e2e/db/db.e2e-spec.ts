import { Client } from 'pg';
import { ConfigService } from '../../../src/shared/configs/config.service.ts';
import { DbService, Transactions } from '../../../src/shared/db/db.service.ts';
import { createProbeApp } from '../../utils/use-test-app.ts';

// No models exist yet, so the role is checked on a scratch table that is dropped afterwards.
const PROBE_TABLE = 'kit_db_probe';
const LOCK_WAIT_TIMEOUT_MS = 15_000;
const STRICT_TIMEOUT = '100ms';

const app = createProbeApp({});

const databaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (url === undefined) {
    throw new Error('DATABASE_URL is not set for e2e');
  }
  return url;
};

const configWith = (url: string): ConfigService => {
  const config = new ConfigService();
  return Object.assign(
    Object.create(Object.getPrototypeOf(config) as object) as ConfigService,
    {
      get: (key: string): unknown =>
        key === 'DATABASE_URL' ? url : config.get(key as 'PORT'),
    },
  );
};

const withOwnDb = async <T>(
  url: string,
  work: (db: DbService) => Promise<T>,
): Promise<T> => {
  const db = new DbService(configWith(url));
  await db.onModuleInit();
  try {
    return await work(db);
  } finally {
    await db.onModuleDestroy();
  }
};

const rowCount = async (db: DbService): Promise<number> => {
  const rows = await db.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT count(*) AS count FROM ${PROBE_TABLE}`,
  );
  return Number(rows[0].count);
};

describe('DbService and Transactions', () => {
  let db: DbService;
  let transactions: Transactions;

  beforeAll(async () => {
    db = app.get(DbService);
    transactions = app.get(Transactions);
    await db.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS ${PROBE_TABLE} (id int PRIMARY KEY, at timestamptz(3), note text)`,
    );
  });

  beforeEach(async () => {
    await db.$executeRawUnsafe(`TRUNCATE ${PROBE_TABLE}`);
  });

  afterAll(async () => {
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS ${PROBE_TABLE}`);
  });

  it('keeps the session in UTC when the database default timezone differs', async () => {
    const dbName = new URL(databaseUrl()).pathname.slice(1);
    await db.$executeRawUnsafe(
      `ALTER DATABASE "${dbName}" SET timezone = 'Asia/Tokyo'`,
    );
    try {
      const moment = new Date('2026-03-29T00:30:00.000Z');
      await withOwnDb(databaseUrl(), async (own) => {
        const zone = await own.$queryRaw<
          { tz: string }[]
        >`SELECT current_setting('TimeZone') AS tz`;
        expect(zone[0].tz).toBe('UTC');
        await own.$executeRawUnsafe(
          `INSERT INTO ${PROBE_TABLE} (id, at) VALUES (1, $1)`,
          moment,
        );
        const rows = await own.$queryRawUnsafe<{ at: Date }[]>(
          `SELECT at FROM ${PROBE_TABLE} WHERE id = 1`,
        );
        expect(rows[0].at.toISOString()).toBe(moment.toISOString());
      });
    } finally {
      await db.$executeRawUnsafe(`ALTER DATABASE "${dbName}" RESET timezone`);
    }
  });

  it('keeps own options from the database address', async () => {
    const url = new URL(databaseUrl());
    url.searchParams.set('options', `-c statement_timeout=${STRICT_TIMEOUT}`);
    await withOwnDb(url.toString(), async (own) => {
      const outside = await own.$queryRaw<
        { value: string }[]
      >`SELECT current_setting('statement_timeout') AS value`;
      expect(outside[0].value).toBe(STRICT_TIMEOUT);
      const inside = await new Transactions(own).run(
        (tx) =>
          tx.$queryRaw<
            { value: string }[]
          >`SELECT current_setting('statement_timeout') AS value`,
      );
      expect(inside[0].value).toBe(STRICT_TIMEOUT);
    });
  });

  it('commits successful work and returns its result', async () => {
    const result = await transactions.run(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO ${PROBE_TABLE} (id) VALUES (1), (2)`,
      );
      return 'done';
    });
    expect(result).toBe('done');
    expect(await rowCount(db)).toBe(2);
  });

  it('rolls everything back and passes the exception through', async () => {
    const failure = new Error('probe failure');
    await expect(
      transactions.run(async (tx) => {
        await tx.$executeRawUnsafe(
          `INSERT INTO ${PROBE_TABLE} (id) VALUES (1)`,
        );
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await rowCount(db)).toBe(0);
  });

  it('applies the 5 s query limit only inside a transaction', async () => {
    const outside = await db.$queryRaw<
      { value: string }[]
    >`SELECT current_setting('statement_timeout') AS value`;
    expect(outside[0].value).toBe('0');
    const inside = await transactions.run(
      (tx) =>
        tx.$queryRaw<
          { value: string }[]
        >`SELECT current_setting('statement_timeout') AS value`,
    );
    expect(inside[0].value).toBe('5s');
  });

  it(
    'aborts a query that waits for a lock longer than the limit and writes nothing',
    async () => {
      await db.$executeRawUnsafe(
        `INSERT INTO ${PROBE_TABLE} (id, note) VALUES (1, 'before')`,
      );
      const holder = new Client({ connectionString: databaseUrl() });
      await holder.connect();
      try {
        await holder.query('BEGIN');
        await holder.query(
          `SELECT id FROM ${PROBE_TABLE} WHERE id = 1 FOR UPDATE`,
        );
        await expect(
          transactions.run(async (tx) => {
            await tx.$executeRawUnsafe(
              `INSERT INTO ${PROBE_TABLE} (id, note) VALUES (2, 'new')`,
            );
            await tx.$executeRawUnsafe(
              `UPDATE ${PROBE_TABLE} SET note = 'after' WHERE id = 1`,
            );
          }),
        ).rejects.toThrow();
      } finally {
        await holder.query('ROLLBACK');
        await holder.end();
      }
      const rows = await db.$queryRawUnsafe<{ id: number; note: string }[]>(
        `SELECT id, note FROM ${PROBE_TABLE} ORDER BY id`,
      );
      expect(rows).toEqual([{ id: 1, note: 'before' }]);
    },
    LOCK_WAIT_TIMEOUT_MS,
  );
});
