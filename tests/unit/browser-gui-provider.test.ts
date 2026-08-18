import { describe, it, expect } from "vitest";
import { GuiObservationNormalizer } from "../../packages/sandbox-contracts/src/browser-gui.js";
import type {
  BrowserGuiSpec,
  GuiActionRequest,
  GuiActionResult
} from "../../packages/sandbox-contracts/src/browser-gui.js";

describe("SemantIQ Sandbox Phase — Browser and GUI Execution Provider", () => {
  const normalizer = new GuiObservationNormalizer();

  const sampleSpec: BrowserGuiSpec = {
    engine: "chromium",
    viewport: { width: 1280, height: 720 },
    headless: true,
    recordVideo: false,
    recordHar: false,
    initialUrl: "https://example.com"
  };

  it("normalizes a successful GUI action execution into an observation event", () => {
    const request: GuiActionRequest = {
      actionId: "act-001",
      type: "click",
      targetSelector: "#submit-btn",
      timeoutMs: 5000,
      captureScreenshotAfter: true
    };

    const result: GuiActionResult = {
      actionId: "act-001",
      success: true,
      currentUrl: "https://example.com/submitted",
      pageTitle: "Submission Complete",
      screenshotSha256: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      domSnapshot: "<html><body>Success</body></html>",
      consoleLogs: [{ type: "info", text: "Form submitted", timestamp: "2026-08-15T16:00:00Z" }],
      durationMs: 120
    };

    const event = normalizer.normalizeActionResult(request, result);
    expect(event.actionId).toBe("act-001");
    expect(event.actionType).toBe("click");
    expect(event.currentUrl).toBe("https://example.com/submitted");
    expect(event.pageTitle).toBe("Submission Complete");
    expect(event.screenshotSha256).toBe(
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    expect(event.consoleErrorsCount).toBe(0);
    expect(event.durationMs).toBe(120);
  });

  it("correctly tracks console errors in normalized GUI events", () => {
    const request: GuiActionRequest = {
      actionId: "act-002",
      type: "navigate",
      url: "https://example.com/error-page",
      timeoutMs: 5000
    };

    const result: GuiActionResult = {
      actionId: "act-002",
      success: true,
      currentUrl: "https://example.com/error-page",
      pageTitle: "Error Page",
      consoleLogs: [
        {
          type: "error",
          text: "Uncaught TypeError: Cannot read property",
          timestamp: "2026-08-15T16:00:00Z"
        },
        { type: "warn", text: "Deprecation warning", timestamp: "2026-08-15T16:00:01Z" }
      ],
      durationMs: 85
    };

    const event = normalizer.normalizeActionResult(request, result);
    expect(event.consoleErrorsCount).toBe(1);
    expect(event.durationMs).toBe(85);
  });
});
