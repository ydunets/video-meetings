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
  // A connection that Postgres drops emits 'error', and the pool emits it
  // again when the connection was idle. Either event without a listener
  // terminates the process. The pool discards the broken connection and
  // opens a new one for the next query, so logging it once is enough.
  database.$client.on('connect', (client) => {
    client.on('error', logLostConnection);
  });
  database.$client.on('error', ignoreErrorLoggedByConnection);
  return database;
}

function logLostConnection(error: Error): void {
  logger.error(`Database connection lost: ${error.message}`);
}

function ignoreErrorLoggedByConnection(): void {
  // logLostConnection has already logged this error.
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
