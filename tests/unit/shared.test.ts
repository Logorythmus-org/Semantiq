import { describe, expect, it, vi } from "vitest";
import {
  ConfigurationError,
  createConsoleLogger,
  redactLogContext,
  serializeError
} from "../../packages/shared/src/index.js";

describe("shared logging and errors", () => {
  it("redacts sensitive logging keys", () => {
    expect(redactLogContext({ token: "abc", safe: "value", apiKey: "secret" })).toEqual({
      token: "[redacted]",
      safe: "value",
      apiKey: "[redacted]"
    });
  });

  it("redacts nested object keys and keys inside arrays", () => {
    const result = redactLogContext({
      token: "outer-secret",
      user: { password: "inner-secret", name: "sample" },
      records: [{ apiKey: "nested-token", metadata: { credential: "deep-secret" } }]
    });
    expect(result).toEqual({
      token: "[redacted]",
      user: { password: "[redacted]", name: "sample" },
      records: [{ apiKey: "[redacted]", metadata: { credential: "[redacted]" } }]
    });
    expect(JSON.stringify(result)).not.toContain("inner-secret");
    expect(JSON.stringify(result)).not.toContain("deep-secret");
  });

  it("handles cycles and shared references without leaking nested tokens", () => {
    const nested: Record<string, unknown> = { token: "sensitive", safe: "ok" };
    nested["self"] = nested;
    const context = { first: nested, second: nested };
    const result = redactLogContext(context);
    expect(result).toEqual({
      first: { token: "[redacted]", safe: "ok", self: "[circular]" },
      second: { token: "[redacted]", safe: "ok", self: "[circular]" }
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("does not invoke object accessor getters during log redaction", () => {
    const getter = vi.fn(() => "private-secret");
    const context: Record<string, unknown> = { safe: "ok" };
    Object.defineProperty(context, "data", { enumerable: true, get: getter });
    expect(redactLogContext(context)).toEqual({ safe: "ok", data: "[accessor]" });
    expect(getter).not.toHaveBeenCalled();
  });

  it("does not invoke overridden Date accessors when serializing logs", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const getter = vi.fn(() => {
      throw new Error("accessor must not run");
    });
    Object.defineProperty(date, "getTime", { get: getter });
    expect(redactLogContext({ timestamp: date })).toEqual({
      timestamp: "2026-01-01T00:00:00.000Z"
    });
    expect(getter).not.toHaveBeenCalled();
  });

  it("does not invoke accessor getters on array items", () => {
    const getter = vi.fn(() => "private-array-secret");
    const values: unknown[] = ["public"];
    Object.defineProperty(values, "1", { enumerable: true, get: getter });
    expect(redactLogContext({ values })).toEqual({ values: ["public", "[accessor]"] });
    expect(getter).not.toHaveBeenCalled();
  });

  it("bounds very large log arrays without serializing their tails", () => {
    const values = Array.from({ length: 2050 }, (_, i) => i);
    const result = redactLogContext({ values });
    const output = result["values"] as unknown[];
    expect(output).toHaveLength(2049);
    expect(output[2048]).toBe("[truncated]");
  });

  it("produces serializable logs when nested credentials and cycles are present", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const context: Record<string, unknown> = {
        session: { password: "hidden-value" },
        bigintCount: BigInt(1)
      };
      context["self"] = context;
      createConsoleLogger({ namespace: "redaction-test" }).info("safe-log", context);
      const output = String(spy.mock.calls[0]?.[0]);
      const record = JSON.parse(output);
      expect(record.context.session.password).toBe("[redacted]");
      expect(record.context.self).toBe("[circular]");
      expect(record.context.bigintCount).toBe("[unserializable]");
      expect(output).not.toContain("hidden-value");
    } finally {
      spy.mockRestore();
    }
  });

  it("writes structured console logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createConsoleLogger({ level: "info", namespace: "test" });

    logger.info("ready", { token: "hidden", requestId: "req-1" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]?.[0])).toContain("[redacted]");
    spy.mockRestore();
  });

  it("serializes application errors without stack traces", () => {
    const serialized = serializeError(
      new ConfigurationError("Bad config", { variable: "DATABASE_URL" })
    );

    expect(serialized).toEqual({
      name: "ConfigurationError",
      code: "CONFIGURATION_ERROR",
      message: "Bad config",
      statusCode: 500,
      details: { variable: "DATABASE_URL" }
    });
  });
});
