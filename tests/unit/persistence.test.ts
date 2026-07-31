import { describe, expect, it } from "vitest";
import {
  SystemMetadataRepository,
  checkDatabaseHealth,
  initialMigration,
  loadPersistenceConfig,
  migrate,
  type SqlClient
} from "../../packages/persistence/src/index.js";

class FakeClient implements SqlClient {
  readonly calls: Array<{ text: string; values?: readonly unknown[] }> = [];
  failOn: string | undefined;
  async query<T extends object>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }> {
    this.calls.push({ text, ...(values ? { values } : {}) });
    if (this.failOn && text.includes(this.failOn)) throw new Error("database failure");
    if (text.startsWith("SELECT version")) return { rows: [], rowCount: 0 };
    if (text.startsWith("SELECT 1")) return { rows: [{} as T], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  }
}

describe("persistence foundation", () => {
  it("loads bounded PostgreSQL configuration", () => {
    expect(
      loadPersistenceConfig({
        DATABASE_URL: "postgresql://localhost/test",
        DATABASE_POOL_SIZE: "4"
      })
    ).toMatchObject({ poolSize: 4, echo: false });
    expect(() => loadPersistenceConfig({ DATABASE_URL: "sqlite://local" })).toThrow();
    expect(() => loadPersistenceConfig({ DATABASE_POOL_SIZE: "0" })).toThrow();
  });

  it("runs the initial migration transactionally", async () => {
    const client = new FakeClient();
    await migrate(client, [initialMigration]);
    expect(client.calls.some((call) => call.text === "BEGIN")).toBe(true);
    expect(
      client.calls.some((call) => call.text.includes("CREATE TABLE IF NOT EXISTS outbox_events"))
    ).toBe(true);
    expect(client.calls.some((call) => call.text === "COMMIT")).toBe(true);
  });

  it("rolls back a failed migration", async () => {
    const client = new FakeClient();
    client.failOn = "CREATE TABLE IF NOT EXISTS outbox_events";
    await expect(migrate(client, [initialMigration])).rejects.toThrow("database failure");
    expect(client.calls.at(-1)?.text).toBe("ROLLBACK");
  });

  it("reports sanitized health status", async () => {
    const healthy = await checkDatabaseHealth(new FakeClient());
    expect(healthy.status).toBe("healthy");
    const failing = new FakeClient();
    failing.failOn = "SELECT 1";
    const unhealthy = await checkDatabaseHealth(failing);
    expect(unhealthy).toMatchObject({
      component: "postgresql",
      status: "unhealthy",
      message: "Database connection unavailable"
    });
    expect(unhealthy.message).not.toContain("postgresql://");
  });

  it("uses parameterized metadata repository queries", async () => {
    const client = new FakeClient();
    const repository = new SystemMetadataRepository(client);
    await repository.add({
      id: "instance",
      value: { environment: "test" },
      updatedAt: new Date("2026-01-01T00:00:00Z")
    });
    expect(client.calls[0]?.text).toContain("VALUES ($1, $2, $3)");
    expect(client.calls[0]?.values?.[0]).toBe("instance");
  });
});
