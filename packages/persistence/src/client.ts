import type { PoolClient, PoolConfig, QueryResultRow } from "pg";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface SqlClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }>;
  release?(): void;
}

export interface SqlPool extends SqlClient {
  connect(): Promise<PoolClient>;
  end(): Promise<void>;
}

export function createPostgresPool(config: PoolConfig | string): SqlPool {
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool(typeof config === "string" ? { connectionString: config } : config);
  pool.on("error", (error) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "postgres.pool.error",
        code: "code" in error ? String(error.code) : "unknown"
      })
    );
  });
  return pool;
}
