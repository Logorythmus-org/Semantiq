import type { UnitOfWork } from "../../shared/src/index.js";
import type { SqlPool, SqlClient } from "./client.js";
import { SystemMetadataRepository } from "./foundation-repository.js";

export class PostgresUnitOfWork implements UnitOfWork {
  private readonly pool: SqlPool;
  private connection: SqlClient | undefined;
  private active = false;
  readonly metadata: SystemMetadataRepository;
  constructor(pool: SqlPool) {
    this.pool = pool;
    this.metadata = new SystemMetadataRepository(this.connectionProxy());
  }
  async begin(): Promise<void> {
    if (this.active) throw new Error("Transaction already active");
    this.connection = await this.pool.connect();
    await this.connection.query("BEGIN");
    this.active = true;
  }
  async commit(): Promise<void> {
    const connection = this.getConnection();
    await connection.query("COMMIT");
    this.release();
  }
  async rollback(): Promise<void> {
    if (!this.active || !this.connection) return;
    await this.connection.query("ROLLBACK");
    this.release();
  }
  async close(): Promise<void> {
    if (this.active) await this.rollback();
  }
  private connectionProxy(): SqlClient {
    return {
      query: async <T extends import("pg").QueryResultRow>(
        text: string,
        values?: readonly unknown[]
      ) => this.getConnection().query<T>(text, values)
    };
  }
  private getConnection(): SqlClient {
    if (!this.active || !this.connection) throw new Error("No active transaction");
    return this.connection;
  }
  private release(): void {
    this.connection?.release?.();
    this.connection = undefined;
    this.active = false;
  }
}
