import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../../packages/shared/src/index.js";
import { loadTechClubConfig } from "../../packages/config/src/index.js";

describe("local backend startup foundation", () => {
  it("loads test-mode configuration and initializes logging", () => {
    const config = loadTechClubConfig({
      NODE_ENV: "test",
      TECHCLUB_ENV: "test",
      DATABASE_URL: "postgresql://techclub:techclub@localhost:5432/techclub_test"
    });
    const logger = createConsoleLogger({ level: "error", namespace: "startup-test" });

    expect(config.nodeEnv).toBe("test");
    expect(config.techclubEnv).toBe("test");
    expect(logger).toHaveProperty("error");
  });
});
