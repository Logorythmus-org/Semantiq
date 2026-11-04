import { describe, expect, it, vi } from "vitest";
import {
  ConfigurationError,
  createConsoleLogger,
  redactLogContext,
  serializeError
} from "../../packages/shared/src/index.js";

describe("shared logging and errors", () => {
  it("redacts sensitive logging keys at top level and recursively in nested objects and arrays", () => {
    expect(
      redactLogContext({
        token: "abc",
        safe: "value",
        apiKey: "secret",
        nested: {
          userPassword: "mypassword",
          config: {
            authSecret: "supersecret",
            publicVal: 123
          }
        },
        items: [{ apiToken: "tok123" }, { name: "item1" }]
      })
    ).toEqual({
      token: "[redacted]",
      safe: "value",
      apiKey: "[redacted]",
      nested: {
        userPassword: "[redacted]",
        config: {
          authSecret: "[redacted]",
          publicVal: 123
        }
      },
      items: [{ apiToken: "[redacted]" }, { name: "item1" }]
    });
  });

  it("writes structured console logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createConsoleLogger({ level: "info", namespace: "test" });

    logger.info("ready", { token: "hidden", requestId: "req-1" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]?.[0])).toContain("[redacted]");
    spy.mockRestore();
  });

  it("preserves dates and handles circular references in log context", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const circular: Record<string, unknown> = { name: "test", created: date };
    circular["self"] = circular;

    const result = redactLogContext(circular);
    expect(result.name).toBe("test");
    expect(result.created).toBe(date);
    expect(result.self).toBe("[circular]");
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
