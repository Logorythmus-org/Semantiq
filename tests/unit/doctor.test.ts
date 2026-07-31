import { describe, expect, it } from "vitest";
import { FirstRunDoctor } from "../../packages/diagnostics/src/index.js";

describe("FirstRunDoctor Diagnostics", () => {
  const doctor = new FirstRunDoctor();

  it("runs doctor diagnostics and reports healthy status", () => {
    const report = doctor.runDoctor();
    expect(report.timestamp).toBeDefined();
    expect(report.nodeVersion).toBeDefined();
    expect(report.platform).toBeDefined();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(["healthy", "warnings"]).toContain(report.overallStatus);
  });

  it("checks node version compatibility", () => {
    const report = doctor.runDoctor();
    const nodeCheck = report.checks.find((c) => c.id === "node-version");
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck?.status).toBe("pass");
  });

  it("lists local and remote connectors with security disclosures", () => {
    const connectors = doctor.getConnectors();
    expect(connectors.length).toBeGreaterThanOrEqual(4);

    const mockConn = connectors.find((c) => c.id === "mock");
    expect(mockConn).toBeDefined();
    expect(mockConn?.type).toBe("local");
    expect(mockConn?.status).toBe("ready");

    const openaiConn = connectors.find((c) => c.id === "openai");
    expect(openaiConn).toBeDefined();
    expect(openaiConn?.type).toBe("remote");
    expect(openaiConn?.requiresAuth).toBe(true);
  });
});
