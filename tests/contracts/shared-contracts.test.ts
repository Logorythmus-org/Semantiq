import { describe, expect, it } from "vitest";
import {
  CapabilityRegistry,
  HealthRegistry,
  MemoryUnitOfWork,
  pageRequest,
  withTransaction
} from "../../packages/shared/src/index.js";

describe("shared contract suite", () => {
  it("keeps unit-of-work commit and rollback explicit", async () => {
    const unit = new MemoryUnitOfWork();
    await withTransaction(unit, async () => undefined);
    await expect(
      withTransaction(unit, async () => {
        throw new Error("rollback");
      })
    ).rejects.toThrow("rollback");
  });
  it("rejects invalid pagination before an adapter query", () => {
    expect(pageRequest(1, 100).limit).toBe(100);
    expect(() => pageRequest(1, 101)).toThrow();
  });
  it("provides versioned capability and health contracts", async () => {
    const capabilities = new CapabilityRegistry();
    capabilities.register({
      name: "test",
      version: "1.0.0",
      description: "test",
      available: true,
      health: "healthy",
      operations: []
    });
    const health = new HealthRegistry();
    health.register("test", () => ({
      component: "test",
      status: "healthy",
      checkedAt: new Date()
    }));
    expect(capabilities.get("test")?.version).toBe("1.0.0");
    expect((await health.check()).status).toBe("healthy");
  });
});
