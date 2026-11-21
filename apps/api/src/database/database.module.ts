import { Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import * as schema from './schema.js';

export const DATABASE = Symbol('DATABASE');

export type Database = NodePgDatabase<typeof schema> & { $client: Pool };

const logger = new Logger('Database');

function createDatabase(config: ConfigService): Database {
  const database = drizzle(config.getOrThrow<string>('DATABASE_URL'), {
    schema,
  });
  // The pool emits 'error' when Postgres drops an idle connection. It has
  // already discarded that connection and opens a new one for the next
  // query, but an unhandled 'error' event would terminate the process.
  database.$client.on('error', (error) => {
    logger.error(`Idle database connection lost: ${error.message}`);
  });
  return database;
}

@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: createDatabase,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onApplicationShutdown(): Promise<void> {
    await this.database.$client.end();
  }
}
