import { ConfigurationError } from "../../shared/src/index.js";

export interface PersistenceConfig {
  readonly databaseUrl: string;
  readonly poolSize: number;
  readonly connectTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly echo: boolean;
}

export function loadPersistenceConfig(
  source: Record<string, string | undefined> = process.env
): PersistenceConfig {
  const databaseUrl =
    source.DATABASE_URL ?? "postgresql://techclub:techclub@localhost:5432/techclub";
  try {
    const parsed = new URL(databaseUrl);
    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) throw new Error("protocol");
  } catch {
    throw new ConfigurationError("DATABASE_URL must be a valid PostgreSQL URL", {
      variable: "DATABASE_URL"
    });
  }
  return {
    databaseUrl,
    poolSize: readPositiveInt(source.DATABASE_POOL_SIZE, 10, "DATABASE_POOL_SIZE"),
    connectTimeoutMs: readPositiveInt(
      source.DATABASE_CONNECT_TIMEOUT,
      5000,
      "DATABASE_CONNECT_TIMEOUT"
    ),
    statementTimeoutMs: readPositiveInt(
      source.DATABASE_STATEMENT_TIMEOUT,
      10000,
      "DATABASE_STATEMENT_TIMEOUT"
    ),
    echo: source.DATABASE_ECHO === "true"
  };
}

function readPositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new ConfigurationError(`${name} must be a positive integer`, { variable: name });
  return parsed;
}
