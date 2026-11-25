import { Global, Injectable, Module } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import { ConfigService } from '../configs/config.service.ts';
import { withUtcSession } from './session-options.ts';

export type Tx = Prisma.TransactionClient;

const STATEMENT_TIMEOUT_MS = 5_000;
const TRANSACTION_TIMEOUT_MS = 5_000;
const UTC = 'UTC';

export class DbSessionError extends Error {
  constructor() {
    super('Database session timezone is not UTC');
    this.name = 'DbSessionError';
  }
}

@Injectable()
export class DbService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: withUtcSession(config.get('DATABASE_URL')),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    const rows = await this.$queryRaw<{ timezone: string }[]>`
      SELECT current_setting('TimeZone') AS timezone`;
    if (rows[0]?.timezone !== UTC) {
      throw new DbSessionError();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

@Injectable()
export class Transactions {
  constructor(private readonly _db: DbService) {}

  run<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this._db.$transaction(
      async (tx) => {
        // Applies the per-query limit only inside this transaction and only
        // when the session has no stricter limit of its own.
        await tx.$executeRaw`
          SELECT set_config('statement_timeout', ${String(STATEMENT_TIMEOUT_MS)}, true)
          FROM pg_settings
          WHERE name = 'statement_timeout'
            AND (setting::int = 0 OR setting::int > ${STATEMENT_TIMEOUT_MS})`;
        return work(tx);
      },
      { maxWait: TRANSACTION_TIMEOUT_MS, timeout: TRANSACTION_TIMEOUT_MS },
    );
  }
}

@Global()
@Module({
  providers: [DbService, Transactions],
  exports: [DbService, Transactions],
})
export class DbModule {}
