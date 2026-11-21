import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { AppModule } from './../src/app.module.js';
import { DATABASE, Database } from './../src/database/database.module.js';

const SELECT_BACKEND_PID = 'SELECT pg_backend_pid() AS pid';
const TERMINATE_BACKEND = 'SELECT pg_terminate_backend($1)';

type BackendPidRow = { pid: number };

describe('Database connection pool (e2e)', () => {
  let app: INestApplication;
  let database: Database;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    database = app.get<Database>(DATABASE);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getBackendPid(): Promise<number> {
    const result =
      await database.$client.query<BackendPidRow>(SELECT_BACKEND_PID);
    return result.rows[0].pid;
  }

  async function terminateBackend(pid: number): Promise<void> {
    const terminatingClient = new Client({
      connectionString: app
        .get(ConfigService)
        .getOrThrow<string>('DATABASE_URL'),
    });
    await terminatingClient.connect();
    try {
      await terminatingClient.query(TERMINATE_BACKEND, [pid]);
    } finally {
      await terminatingClient.end();
    }
  }

  it('keeps serving queries after Postgres drops an idle connection', async () => {
    const loggedError = vi.spyOn(Logger.prototype, 'error');
    const droppedPid = await getBackendPid();

    await terminateBackend(droppedPid);
    await vi.waitFor(() => expect(database.$client.totalCount).toBe(0));
    expect(loggedError).toHaveBeenCalledOnce();

    const reconnectedPid = await getBackendPid();
    expect(reconnectedPid).not.toBe(droppedPid);
  });
});
