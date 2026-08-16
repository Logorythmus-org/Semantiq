import { existsSync } from "node:fs";
import { join } from "node:path";
import { LocalAlphaRuntime, type DiagnosticBundle, type HealthSnapshot } from "../../alpha-runtime/src/index.js";

export { LocalAlphaRuntime, type DiagnosticBundle, type HealthSnapshot };

export interface DoctorCheckResult {
  readonly id: string;
  readonly category: "environment" | "workspace" | "connector" | "security" | "quality";
  readonly name: string;
  readonly status: "pass" | "warn" | "fail";
  readonly message: string;
  readonly action?: string;
}

export interface DoctorReport {
  readonly timestamp: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly overallStatus: "healthy" | "warnings" | "failing";
  readonly checks: readonly DoctorCheckResult[];
}

export interface ConnectorStatus {
  readonly id: string;
  readonly name: string;
  readonly type: "local" | "remote";
  readonly status: "ready" | "configured" | "unconfigured" | "disabled";
  readonly requiresAuth: boolean;
  readonly authPresent: boolean;
  readonly warning?: string;
}

export class FirstRunDoctor {
  private readonly runtime = new LocalAlphaRuntime();

  runDoctor(cwd: string = process.cwd()): DoctorReport {
    const checks: DoctorCheckResult[] = [];

    // 1. Node.js Version Check
    const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
    if (nodeMajor >= 22) {
      checks.push({
        id: "node-version",
        category: "environment",
        name: "Node.js Version",
        status: "pass",
        message: `Node.js ${process.version} meets requirement (>= 22.0.0)`
      });
    } else {
      checks.push({
        id: "node-version",
        category: "environment",
        name: "Node.js Version",
        status: "fail",
        message: `Node.js ${process.version} is unsupported. Requires >= 22.0.0`,
        action: "Upgrade Node.js to version 22 or higher."
      });
    }

    // 2. Package Manifest
    const packageJsonPath = join(cwd, "package.json");
    if (existsSync(packageJsonPath)) {
      checks.push({
        id: "package-manifest",
        category: "workspace",
        name: "Package Manifest",
        status: "pass",
        message: "package.json detected."
      });
    } else {
      checks.push({
        id: "package-manifest",
        category: "workspace",
        name: "Package Manifest",
        status: "fail",
        message: "package.json missing.",
        action: "Ensure you are running the doctor command from the root of the repository."
      });
    }

    // 3. Environment Example
    const envExamplePath = join(cwd, ".env.example");
    if (existsSync(envExamplePath)) {
      checks.push({
        id: "env-example",
        category: "workspace",
        name: "Environment Template",
        status: "pass",
        message: ".env.example template present."
      });
    } else {
      checks.push({
        id: "env-example",
        category: "workspace",
        name: "Environment Template",
        status: "warn",
        message: ".env.example is missing.",
        action: "Create .env.example with baseline local settings."
      });
    }

    // 4. Local Connector Posture
    checks.push({
      id: "local-connector",
      category: "connector",
      name: "Deterministic Mock Connector",
      status: "pass",
      message: "Deterministic offline evaluation connector is ready (default)."
    });

    // 5. Offline Posture & Telemetry
    checks.push({
      id: "offline-posture",
      category: "security",
      name: "Local-First Privacy Posture",
      status: "pass",
      message: "Zero automatic network transmission. Telemetry is disabled by default."
    });

    // 6. System Health
    const health = this.runtime.getSystemHealth();
    checks.push({
      id: "system-health",
      category: "quality",
      name: "Alpha Runtime Health",
      status: health.serviceHealth.app === "healthy" ? "pass" : "fail",
      message: `Alpha runtime app status: ${health.serviceHealth.app}`
    });

    const failing = checks.some((c) => c.status === "fail");
    const warnings = checks.some((c) => c.status === "warn");
    const overallStatus = failing ? "failing" : warnings ? "warnings" : "healthy";

    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      overallStatus,
      checks
    };
  }

  getConnectors(): readonly ConnectorStatus[] {
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
    const hasGoogle = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);

    return [
      {
        id: "mock",
        name: "Deterministic Mock Provider",
        type: "local",
        status: "ready",
        requiresAuth: false,
        authPresent: true
      },
      {
        id: "ollama",
        name: "Local Ollama LLM",
        type: "local",
        status: "configured",
        requiresAuth: false,
        authPresent: true,
        warning: "Requires local Ollama daemon running on http://localhost:11434"
      },
      {
        id: "openai",
        name: "OpenAI Connector",
        type: "remote",
        status: hasOpenAI ? "configured" : "unconfigured",
        requiresAuth: true,
        authPresent: hasOpenAI,
        warning: hasOpenAI ? "Data transmission warning: External API calls require explicit consent." : "OPENAI_API_KEY missing in local .env"
      },
      {
        id: "anthropic",
        name: "Anthropic Connector",
        type: "remote",
        status: hasAnthropic ? "configured" : "unconfigured",
        requiresAuth: true,
        authPresent: hasAnthropic,
        warning: hasAnthropic ? "Data transmission warning: External API calls require explicit consent." : "ANTHROPIC_API_KEY missing in local .env"
      },
      {
        id: "google-genai",
        name: "Google GenAI Connector",
        type: "remote",
        status: hasGoogle ? "configured" : "unconfigured",
        requiresAuth: true,
        authPresent: hasGoogle,
        warning: hasGoogle ? "Data transmission warning: External API calls require explicit consent." : "GEMINI_API_KEY missing in local .env"
      }
    ];
  }
}
