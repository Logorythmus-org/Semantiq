/**
 * @package @tech-club/sandbox-contracts
 * Browser and GUI Execution Provider-Neutral Contracts and Interfaces
 */

export type BrowserEngineType = "chromium" | "firefox" | "webkit" | "virtual_desktop";

export interface ViewportSpec {
  readonly width: number;
  readonly height: number;
  readonly deviceScaleFactor?: number | undefined;
  readonly isMobile?: boolean | undefined;
}

export interface BrowserGuiSpec {
  readonly engine: BrowserEngineType;
  readonly viewport: ViewportSpec;
  readonly headless: boolean;
  readonly userAgent?: string | undefined;
  readonly recordVideo: boolean;
  readonly recordHar: boolean;
  readonly initialUrl?: string | undefined;
  readonly locale?: string | undefined;
  readonly timezoneId?: string | undefined;
}

export type GuiActionType =
  | "navigate"
  | "click"
  | "type"
  | "press_key"
  | "hover"
  | "scroll"
  | "drag_and_drop"
  | "screenshot"
  | "evaluate_js"
  | "get_dom_tree"
  | "get_accessibility_tree";

export interface Coordinates {
  readonly x: number;
  readonly y: number;
}

export interface GuiActionRequest {
  readonly actionId: string;
  readonly type: GuiActionType;
  readonly targetSelector?: string | undefined;
  readonly coordinates?: Coordinates | undefined;
  readonly text?: string | undefined;
  readonly key?: string | undefined;
  readonly url?: string | undefined;
  readonly script?: string | undefined;
  readonly timeoutMs: number;
  readonly captureScreenshotAfter?: boolean | undefined;
}

export interface ConsoleMessage {
  readonly type: "log" | "info" | "warn" | "error";
  readonly text: string;
  readonly timestamp: string;
}

export interface GuiActionResult {
  readonly actionId: string;
  readonly success: boolean;
  readonly currentUrl: string;
  readonly pageTitle: string;
  readonly screenshotBase64?: string | undefined;
  readonly screenshotSha256?: string | undefined;
  readonly domSnapshot?: string | undefined;
  readonly consoleLogs: readonly ConsoleMessage[];
  readonly durationMs: number;
  readonly errorMessage?: string | undefined;
}

export interface GuiObservationEvent {
  readonly actionId: string;
  readonly actionType: GuiActionType;
  readonly currentUrl: string;
  readonly pageTitle: string;
  readonly screenshotSha256?: string | undefined;
  readonly domHash: string;
  readonly consoleErrorsCount: number;
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface IBrowserGuiProvider {
  launchBrowserSession(spec: BrowserGuiSpec): Promise<IBrowserGuiSession>;
}

export interface IBrowserGuiSession {
  readonly sessionId: string;
  readonly spec: BrowserGuiSpec;

  executeAction(request: GuiActionRequest): Promise<GuiActionResult>;
  captureScreenshot(): Promise<{ readonly base64: string; readonly sha256: string }>;
  close(): Promise<void>;
}

/**
 * GUI Observation Normalizer.
 * Creates deterministic evidence records from GUI action executions.
 */
export class GuiObservationNormalizer {
  normalizeActionResult(request: GuiActionRequest, result: GuiActionResult): GuiObservationEvent {
    const errorLogs = result.consoleLogs.filter((l) => l.type === "error").length;
    const domHash = result.domSnapshot ? `dom:${result.domSnapshot.length}` : "none";

    return {
      actionId: request.actionId,
      actionType: request.type,
      currentUrl: result.currentUrl,
      pageTitle: result.pageTitle,
      screenshotSha256: result.screenshotSha256,
      domHash,
      consoleErrorsCount: errorLogs,
      durationMs: result.durationMs,
      timestamp: new Date().toISOString()
    };
  }
}
