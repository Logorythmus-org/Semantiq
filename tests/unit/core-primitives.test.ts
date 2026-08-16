import { describe, expect, it } from "vitest";
import {
  CapabilityRegistry,
  Entity,
  FixedClock,
  HealthRegistry,
  InMemoryEventDispatcher,
  InMemoryIdempotencyStore,
  LocalFeatureFlags,
  MemoryUnitOfWork,
  ValueObject,
  apiError,
  apiSuccess,
  createEvent,
  createPage,
  failure,
  mapResult,
  pageRequest,
  parseId,
  sortBy,
  success,
  withTransaction
} from "../../packages/shared/src/index.js";

class Name extends ValueObject<{ name: string }> {
  constructor(name: string) {
    if (!name.trim()) throw new Error("name required");
    super({ name });
  }
}
class User extends Entity {
  constructor(id: string) {
    super(id);
  }

  rename(name: string): void {
    this.record(
      createEvent("UserRenamed", { name }, { metadata: {}, schemaVersion: 1, aggregateId: this.id })
    );
  }
}

describe("shared core primitives", () => {
  it("validates identifiers and provides deterministic clocks", () => {
    expect(parseId("user-1")).toBe("user-1");
    expect(() => parseId("bad id")).toThrow();
    const clock = new FixedClock(new Date("2026-01-01T00:00:00.000Z"));
    expect(clock.now().toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("supports identity equality and event collection", () => {
    const user = new User("user-1");
    expect(user.equals(new User("user-1"))).toBe(true);
    user.rename("Ada");
    expect(user.pullEvents()).toHaveLength(1);
    expect(user.pullEvents()).toHaveLength(0);
  });

  it("keeps value objects structural and validated", () => {
    expect(new Name("Ada").equals(new Name("Ada"))).toBe(true);
    expect(() => new Name(" ")).toThrow();
  });

  it("dispatches versioned events and preserves metadata", async () => {
    const dispatcher = new InMemoryEventDispatcher();
    const seen: string[] = [];
    dispatcher.subscribe("Created", (event) => {
      seen.push(event.type);
    });
    const event = createEvent(
      "Created",
      { id: 1 },
      { metadata: { source: "test" }, schemaVersion: 2, correlation: { correlationId: "corr-1" } }
    );
    await dispatcher.dispatch(event);
    expect(seen).toEqual(["Created"]);
    expect(event.schemaVersion).toBe(2);
  });

  it("models result success, failure and mapping", () => {
    const result = mapResult(success(2), (value) => value * 2);
    expect(result).toEqual({ ok: true, value: 4 });
    expect(failure({ code: "bad", message: "Bad input", category: "validation" }).ok).toBe(false);
    expect(apiSuccess({ ok: true }, "1.0", "corr-1").meta.correlationId).toBe("corr-1");
    expect(apiError({ code: "bad", message: "Bad input", category: "validation" }).error.code).toBe(
      "bad"
    );
  });

  it("validates pagination, filtering and sorting boundaries", () => {
    const request = pageRequest(2, 2);
    expect(createPage(["a", "b"], request, 5).hasNext).toBe(true);
    expect(sortBy("createdAt", "desc", ["createdAt"])).toEqual({
      field: "createdAt",
      direction: "desc"
    });
    expect(() => pageRequest(0, 2)).toThrow();
    expect(() => sortBy("unsafe", "asc", ["createdAt"])).toThrow();
  });

  it("commits successful work and rolls back failed work", async () => {
    const unit = new MemoryUnitOfWork();
    await withTransaction(unit, async () => undefined);
    await expect(
      withTransaction(unit, async () => {
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");
    await expect(unit.commit()).rejects.toThrow("No active transaction");
  });

  it("prevents idempotency key reuse", () => {
    const store = new InMemoryIdempotencyStore();
    store.put({ key: "request-1", scope: "users", response: { id: 1 } });
    expect(store.get("users", "request-1")?.response).toEqual({ id: 1 });
    expect(() => store.put({ key: "request-1", scope: "users", response: {} })).toThrow();
  });

  it("supports local flags, capabilities and health aggregation", async () => {
    const flags = new LocalFeatureFlags({ beta: false });
    expect(flags.isEnabled("beta")).toBe(false);
    flags.setForTest("beta", true);
    expect(flags.isEnabled("beta")).toBe(true);
    const capabilities = new CapabilityRegistry();
    capabilities.register({
      name: "core",
      version: "1.0.0",
      description: "Core",
      available: true,
      health: "healthy",
      operations: ["read"]
    });
    expect(capabilities.list()).toHaveLength(1);
    const health = new HealthRegistry();
    health.register("database", () => ({
      component: "database",
      status: "healthy",
      checkedAt: new Date()
    }));
    expect((await health.check()).status).toBe("healthy");
  });
});
