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
      expect(response.headers.get("content-security-policy")).toBe(
        "default-src 'none'; frame-ancestors 'none'; sandbox"
      );
    } finally {
      await api.stop();
    }
  });
  it("rejects unauthorized host headers on API requests", async () => {
    const { createApiApplication } = await import("../../services/api/src/index.js");
    const { request: httpRequest } = await import("node:http");
    const api = createApiApplication({ listenPort: 0 });
    await api.start();
    try {
      const address = api.server.address();
      if (!address || typeof address === "string") throw new Error("API failed to bind port");
      const res = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        const req = httpRequest(
          `http://127.0.0.1:${address.port}/health`,
          { headers: { Host: "evil.com" } },
          (response) => {
            let body = "";
            response.on("data", (chunk) => (body += String(chunk)));
            response.on("end", () =>
              resolve({ statusCode: response.statusCode ?? 0, body })
            );
          }
        );
        req.on("error", reject);
        req.end();
      });
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body) as { error: { code: string } };
      expect(data.error.code).toBe("INVALID_HOST");
    } finally {
      await api.stop();
    }
  });
});
