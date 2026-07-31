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
