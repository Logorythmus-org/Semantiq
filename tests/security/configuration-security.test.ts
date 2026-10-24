import { describe, expect, it } from "vitest";
import { diagnoseSettings, loadTechClubSettings } from "../../packages/config/src/index.js";

describe("configuration security regressions", () => {
  it("does not expose provider keys in diagnostics", () => {
    const settings = loadTechClubSettings({
      values: { GITHUB_TOKEN: "real-looking-local-token", GITHUB_INTEGRATION_ENABLED: "true" }
    });
    const output = JSON.stringify(diagnoseSettings(settings));
    expect(output).not.toContain("real-looking-local-token");
    expect(output).toContain("githubToken");
  });
  it("rejects paths outside the configured data root", () => {
    expect(() =>
      loadTechClubSettings({ values: { TECHCLUB_DATA_DIR: ".techclub/test", UPLOADS_PATH: ".." } })
    ).toThrow("escapes TECHCLUB_DATA_DIR");
  });
  it("keeps optional AI disabled without network access", () => {
    expect(loadTechClubSettings().ai).toMatchObject({
      provider: "disabled",
      enabled: false,
      localOnly: true
    });
  });
  it("returns standard security headers on API responses", async () => {
    const { createApiApplication } = await import("../../services/api/src/index.js");
    const api = createApiApplication({ listenPort: 0 });
    await api.start();
    try {
      const address = api.server.address();
      if (!address || typeof address === "string") throw new Error("API failed to bind port");
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    } finally {
      await api.stop();
    }
  });

  it("rejects request bodies exceeding size limits before stream buffer allocation", async () => {
    const { createApiApplication } = await import("../../services/api/src/index.js");
    const api = createApiApplication({
      listenPort: 0,
      questionApplication: { create: async () => ({ ok: false, error: {} }) } as never
    });
    await api.start();
    try {
      const address = api.server.address();
      if (!address || typeof address === "string") throw new Error("API failed to bind port");
      const oversized = JSON.stringify({ text: "a".repeat(70_000) });
      const response = await fetch(`http://127.0.0.1:${address.port}/questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: oversized
      });
      expect(response.status).toBe(422);
      const payload = (await response.json()) as { error: { code: string; message: string } };
      expect(payload.error.code).toBe("INVALID_JSON");
    } finally {
      await api.stop();
    }
  });
});
