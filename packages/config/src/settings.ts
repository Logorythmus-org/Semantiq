import { mkdir } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { ConfigurationError } from "../../shared/src/index.js";
import { loadPersistenceConfig, type PersistenceConfig } from "../../persistence/src/index.js";

export type RuntimeProfile = "development" | "test" | "docker" | "benchmark" | "migration";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LocalAiProvider = "disabled" | "ollama" | "openai-compatible";
export interface ConfigSourceValues {
  readonly values?: Record<string, string | undefined>;
  readonly files?: Readonly<Record<string, string | undefined>>;
  readonly overrides?: Record<string, string | undefined>;
}

export class SecretValue {
  private readonly secret: string;
  constructor(secret: string) {
    this.secret = secret;
    if (!secret) throw new ConfigurationError("Secret value cannot be empty");
  }
  toString(): string {
    return "[redacted]";
  }
  toJSON(): string {
    return "[redacted]";
  }
  isPresent(): boolean {
    return this.secret.length > 0;
  }
  unsafeValue(): string {
    return this.secret;
  }
}

export interface RuntimePaths {
  readonly root: string;
  readonly data: string;
  readonly uploads: string;
  readonly artifacts: string;
  readonly research: string;
  readonly benchmarks: string;
  readonly temp: string;
  readonly logs: string;
  readonly modelCache: string;
  readonly testArtifacts: string;
  readonly backups: string;
}
export interface ApplicationSettings {
  readonly name: string;
  readonly version: string;
  readonly profile: RuntimeProfile;
  readonly debug: boolean;
  readonly host: string;
  readonly port: number;
  readonly basePath: string;
  readonly shutdownTimeoutMs: number;
  readonly startupValidation: "strict" | "warn";
}
export interface LoggingSettings {
  readonly level: LogLevel;
  readonly format: "json" | "text";
  readonly timestamps: boolean;
  readonly sql: boolean;
  readonly redactSensitive: true;
  readonly logDirectory: string;
}
export interface LocalAiSettings {
  readonly provider: LocalAiProvider;
  readonly baseUrl?: string;
  readonly model?: string;
  readonly embeddingModel?: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly localOnly: true;
  readonly enabled: boolean;
}
export interface OptionalProviderSettings {
  readonly githubEnabled: boolean;
  readonly githubToken?: SecretValue;
  readonly openAiEnabled: boolean;
  readonly openAiApiKey?: SecretValue;
}
export interface SecuritySettings {
  readonly allowedHosts: readonly string[];
  readonly requestSizeLimitBytes: number;
  readonly metadataSizeLimitBytes: number;
  readonly maxPageSize: number;
  readonly maxIdempotencyKeyLength: number;
  readonly correlationIdMaxLength: number;
  readonly healthDetail: "minimal" | "local";
}
export interface FeatureFlagSettings {
  readonly values: Readonly<Record<string, boolean>>;
}
export interface TestSettings {
  readonly networkDisabled: boolean;
  readonly deterministic: boolean;
  readonly dataRoot: string;
}
export interface BenchmarkSettings {
  readonly iterations: number;
  readonly warmups: number;
  readonly outputDirectory: string;
  readonly seed: number;
}
export interface TechClubSettings {
  readonly application: ApplicationSettings;
  readonly database: PersistenceConfig;
  readonly logging: LoggingSettings;
  readonly paths: RuntimePaths;
  readonly ai: LocalAiSettings;
  readonly providers: OptionalProviderSettings;
  readonly security: SecuritySettings;
  readonly featureFlags: FeatureFlagSettings;
  readonly test: TestSettings;
  readonly benchmark: BenchmarkSettings;
  readonly sources: Readonly<Record<string, "override" | "environment" | "profile" | "default">>;
}

const profileDefaults: Record<RuntimeProfile, Record<string, string>> = {
  development: {
    DEBUG: "false",
    LOG_LEVEL: "info",
    TECHCLUB_DATA_DIR: ".techclub/development",
    DATABASE_ECHO: "false"
  },
  test: {
    DEBUG: "false",
    LOG_LEVEL: "warn",
    TECHCLUB_DATA_DIR: ".techclub/test",
    DATABASE_ECHO: "false",
    TECHCLUB_NETWORK_DISABLED: "true"
  },
  docker: {
    DEBUG: "false",
    LOG_LEVEL: "info",
    TECHCLUB_DATA_DIR: "/var/lib/techclub",
    DATABASE_ECHO: "false"
  },
  benchmark: {
    DEBUG: "false",
    LOG_LEVEL: "error",
    TECHCLUB_DATA_DIR: ".techclub/benchmark",
    DATABASE_ECHO: "false"
  },
  migration: {
    DEBUG: "false",
    LOG_LEVEL: "info",
    TECHCLUB_DATA_DIR: ".techclub/migration",
    DATABASE_ECHO: "false"
  }
};

export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    result[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
  }
  return result;
}

export function loadTechClubSettings(input: ConfigSourceValues = {}): TechClubSettings {
  const environment = input.values ?? process.env;
  const requestedProfile =
    input.overrides?.TECHCLUB_PROFILE ?? environment.TECHCLUB_PROFILE ?? "development";
  const profile = parseProfile(requestedProfile);
  const profileValues = profileDefaults[profile];
  const fileValues = input.files ?? {};
  const sources: Record<string, "override" | "environment" | "profile" | "default"> = {};
  const read = (key: string, fallback = ""): string => {
    if (input.overrides?.[key] !== undefined) {
      sources[key] = "override";
      return input.overrides[key]!;
    }
    if (environment[key] !== undefined) {
      sources[key] = "environment";
      return environment[key]!;
    }
    if (fileValues[key] !== undefined) {
      sources[key] = "profile";
      return fileValues[key]!;
    }
    if (profileValues[key] !== undefined) {
      sources[key] = "profile";
      return profileValues[key]!;
    }
    sources[key] = "default";
    return fallback;
  };
  const root = resolvePath(read("TECHCLUB_DATA_DIR", ".techclub"));
  const paths = makePaths(root, read);
  const database = loadPersistenceConfig({
    DATABASE_URL: read(
      "DATABASE_URL",
      profile === "test"
        ? "postgresql://techclub:techclub@localhost:5432/techclub_test"
        : "postgresql://techclub:techclub@localhost:5432/techclub"
    ),
    DATABASE_POOL_SIZE: read("DATABASE_POOL_SIZE", "10"),
    DATABASE_CONNECT_TIMEOUT: read("DATABASE_CONNECT_TIMEOUT", "5000"),
    DATABASE_STATEMENT_TIMEOUT: read("DATABASE_STATEMENT_TIMEOUT", "10000"),
    DATABASE_ECHO: read("DATABASE_ECHO", "false")
  });
  const ai = makeAiSettings(read);
  const settings: TechClubSettings = {
    application: {
      name: read("APP_NAME", "Tech Club"),
      version: read("APP_VERSION", "0.0.0"),
      profile,
      debug: parseBoolean(read("DEBUG", "false"), "DEBUG"),
      host: read("API_HOST", profile === "docker" ? "0.0.0.0" : "127.0.0.1"),
      port: parsePort(read("API_PORT", "8080")),
      basePath: read("API_BASE_PATH", "/api"),
      shutdownTimeoutMs: parsePositive(read("SHUTDOWN_TIMEOUT_MS", "10000"), "SHUTDOWN_TIMEOUT_MS"),
      startupValidation: read("STARTUP_VALIDATION", "strict") === "warn" ? "warn" : "strict"
    },
    database,
    logging: {
      level: parseLogLevel(read("LOG_LEVEL", "info")),
      format: read("LOG_FORMAT", "json") === "text" ? "text" : "json",
      timestamps: parseBoolean(read("LOG_TIMESTAMPS", "true"), "LOG_TIMESTAMPS"),
      sql: parseBoolean(read("DATABASE_ECHO", "false"), "DATABASE_ECHO"),
      redactSensitive: true,
      logDirectory: paths.logs
    },
    paths,
    ai,
    providers: {
      githubEnabled: parseBoolean(
        read("GITHUB_INTEGRATION_ENABLED", "false"),
        "GITHUB_INTEGRATION_ENABLED"
      ),
      ...(optionalSecret(read("GITHUB_TOKEN", ""))
        ? { githubToken: optionalSecret(read("GITHUB_TOKEN", ""))! }
        : {}),
      openAiEnabled: parseBoolean(
        read("OPENAI_INTEGRATION_ENABLED", "false"),
        "OPENAI_INTEGRATION_ENABLED"
      ),
      ...(optionalSecret(read("OPENAI_API_KEY", ""))
        ? { openAiApiKey: optionalSecret(read("OPENAI_API_KEY", ""))! }
        : {})
    },
    security: {
      allowedHosts: read("ALLOWED_HOSTS", "127.0.0.1,localhost")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
      requestSizeLimitBytes: parsePositive(
        read("REQUEST_SIZE_LIMIT_BYTES", "1048576"),
        "REQUEST_SIZE_LIMIT_BYTES"
      ),
      metadataSizeLimitBytes: parsePositive(
        read("METADATA_SIZE_LIMIT_BYTES", "65536"),
        "METADATA_SIZE_LIMIT_BYTES"
      ),
      maxPageSize: parseBounded(read("MAX_PAGE_SIZE", "100"), 1, 1000, "MAX_PAGE_SIZE"),
      maxIdempotencyKeyLength: parseBounded(
        read("MAX_IDEMPOTENCY_KEY_LENGTH", "128"),
        8,
        512,
        "MAX_IDEMPOTENCY_KEY_LENGTH"
      ),
      correlationIdMaxLength: parseBounded(
        read("CORRELATION_ID_MAX_LENGTH", "128"),
        16,
        512,
        "CORRELATION_ID_MAX_LENGTH"
      ),
      healthDetail:
        read(
          "HEALTH_DETAIL",
          profile === "development" || profile === "test" ? "local" : "minimal"
        ) === "local"
          ? "local"
          : "minimal"
    },
    featureFlags: { values: readFlags(read("FEATURE_FLAGS", "")) },
    test: {
      networkDisabled: parseBoolean(
        read("TECHCLUB_NETWORK_DISABLED", profile === "test" ? "true" : "false"),
        "TECHCLUB_NETWORK_DISABLED"
      ),
      deterministic: parseBoolean(
        read("TEST_DETERMINISTIC", profile === "test" ? "true" : "false"),
        "TEST_DETERMINISTIC"
      ),
      dataRoot: paths.testArtifacts
    },
    benchmark: {
      iterations: parsePositive(read("BENCHMARK_ITERATIONS", "10"), "BENCHMARK_ITERATIONS"),
      warmups: parsePositive(read("BENCHMARK_WARMUPS", "2"), "BENCHMARK_WARMUPS"),
      outputDirectory: paths.benchmarks,
      seed: parsePositive(read("BENCHMARK_SEED", "42"), "BENCHMARK_SEED")
    },
    sources
  };
  validateSettings(settings);
  return settings;
}

export function diagnoseSettings(settings: TechClubSettings): {
  readonly profile: RuntimeProfile;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly publicValues: Readonly<Record<string, unknown>>;
} {
  const warnings: string[] = [];
  if (settings.ai.provider !== "disabled")
    warnings.push(
      "Local AI is configured but availability is not checked during configuration loading."
    );
  if (settings.database.echo) warnings.push("Database echo logging is enabled.");
  return {
    profile: settings.application.profile,
    errors: [],
    warnings,
    publicValues: {
      profile: settings.application.profile,
      database: maskDatabaseUrl(settings.database.databaseUrl),
      dataRoot: settings.paths.root,
      aiProvider: settings.ai.provider,
      featureFlags: settings.featureFlags.values,
      secrets: {
        githubToken: Boolean(settings.providers.githubToken),
        openAiApiKey: Boolean(settings.providers.openAiApiKey)
      }
    }
  };
}

export function explainSetting(
  settings: TechClubSettings,
  key: string
): { readonly key: string; readonly source: string; readonly value: unknown } {
  const source = settings.sources[key] ?? "default";
  if (/PASSWORD|TOKEN|KEY|SECRET|API_KEY/i.test(key)) return { key, source, value: "[redacted]" };
  return { key, source, value: settings.sources[key] ? "configured" : "default" };
}

export async function bootstrapLocalEnvironment(
  settings: TechClubSettings,
  dryRun = false
): Promise<readonly string[]> {
  const directories: string[] = [
    settings.paths.root,
    settings.paths.data,
    settings.paths.uploads,
    settings.paths.artifacts,
    settings.paths.research,
    settings.paths.benchmarks,
    settings.paths.temp,
    settings.paths.logs,
    settings.paths.modelCache,
    settings.paths.testArtifacts,
    settings.paths.backups
  ];
  if (!dryRun)
    await Promise.all(directories.map((directory) => mkdir(directory, { recursive: true })));
  return directories;
}

function makePaths(root: string, read: (key: string, fallback?: string) => string): RuntimePaths {
  const child = (key: string, fallback: string) => resolveChild(root, read(key, fallback));
  return {
    root,
    data: child("DATA_PATH", "data"),
    uploads: child("UPLOADS_PATH", "uploads"),
    artifacts: child("ARTIFACTS_PATH", "artifacts"),
    research: child("RESEARCH_PATH", "research"),
    benchmarks: child("BENCHMARK_PATH", "benchmarks"),
    temp: child("TEMP_PATH", "tmp"),
    logs: child("LOG_PATH", "logs"),
    modelCache: child("MODEL_CACHE_PATH", "models"),
    testArtifacts: child("TEST_ARTIFACTS_PATH", "test-artifacts"),
    backups: child("BACKUP_PATH", "backups")
  };
}
function resolvePath(value: string): string {
  return isAbsolute(value) ? resolve(value) : resolve(process.cwd(), value);
}
function resolveChild(root: string, child: string): string {
  const result = isAbsolute(child) ? resolve(child) : resolve(root, child);
  const rel = relative(root, result);
  if (rel.startsWith("..") || isAbsolute(rel))
    throw new ConfigurationError("Configured path escapes TECHCLUB_DATA_DIR", { root });
  return result;
}
function makeAiSettings(read: (key: string, fallback?: string) => string): LocalAiSettings {
  const provider = read("LOCAL_AI_PROVIDER", "disabled") as LocalAiProvider;
  if (!["disabled", "ollama", "openai-compatible"].includes(provider))
    throw new ConfigurationError(`Unsupported local AI provider: ${provider}`, {
      variable: "LOCAL_AI_PROVIDER"
    });
  const baseUrl = read("LOCAL_AI_BASE_URL", "");
  return {
    provider,
    ...(baseUrl ? { baseUrl } : {}),
    ...(read("LOCAL_AI_MODEL", "") ? { model: read("LOCAL_AI_MODEL", "") } : {}),
    ...(read("LOCAL_AI_EMBEDDING_MODEL", "")
      ? { embeddingModel: read("LOCAL_AI_EMBEDDING_MODEL", "") }
      : {}),
    timeoutMs: parsePositive(read("LOCAL_AI_TIMEOUT_MS", "30000"), "LOCAL_AI_TIMEOUT_MS"),
    maxRetries: parsePositive(read("LOCAL_AI_MAX_RETRIES", "2"), "LOCAL_AI_MAX_RETRIES"),
    localOnly: true,
    enabled: provider !== "disabled"
  };
}
function validateSettings(settings: TechClubSettings): void {
  if (
    settings.application.profile === "test" &&
    !/_test(?:$|[?])/i.test(new URL(settings.database.databaseUrl).pathname)
  )
    throw new ConfigurationError("Test profile must target a test database", {
      variable: "DATABASE_URL"
    });
  if (settings.application.profile === "docker" && !settings.application.host.includes("0.0.0.0"))
    throw new ConfigurationError("Docker profile requires API_HOST=0.0.0.0", {
      variable: "API_HOST"
    });
  if (settings.providers.githubEnabled && !settings.providers.githubToken)
    throw new ConfigurationError("GITHUB_TOKEN is required when GitHub integration is enabled", {
      variable: "GITHUB_TOKEN"
    });
  if (settings.providers.openAiEnabled && !settings.providers.openAiApiKey)
    throw new ConfigurationError("OPENAI_API_KEY is required when OpenAI integration is enabled", {
      variable: "OPENAI_API_KEY"
    });
}
function parseProfile(value: string): RuntimeProfile {
  if (["development", "test", "docker", "benchmark", "migration"].includes(value))
    return value as RuntimeProfile;
  throw new ConfigurationError(`Invalid TECHCLUB_PROFILE: ${value}`, {
    variable: "TECHCLUB_PROFILE"
  });
}
function parseBoolean(value: string, name: string): boolean {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new ConfigurationError(`${name} must be a boolean`, { variable: name });
}
function parsePositive(value: string, name: string): number {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1)
    throw new ConfigurationError(`${name} must be a positive integer`, { variable: name });
  return result;
}
function parseBounded(value: string, min: number, max: number, name: string): number {
  const result = parsePositive(value, name);
  if (result < min || result > max)
    throw new ConfigurationError(`${name} must be between ${min} and ${max}`, { variable: name });
  return result;
}
function parsePort(value: string): number {
  return parseBounded(value, 1, 65535, "API_PORT");
}
function parseLogLevel(value: string): LogLevel {
  if (["debug", "info", "warn", "error"].includes(value)) return value as LogLevel;
  throw new ConfigurationError(`Invalid LOG_LEVEL: ${value}`, { variable: "LOG_LEVEL" });
}
function optionalSecret(value: string): SecretValue | undefined {
  return value ? new SecretValue(value) : undefined;
}
function readFlags(value: string): Readonly<Record<string, boolean>> {
  const flags: Record<string, boolean> = {};
  for (const item of value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    const [name, enabled] = item.split("=");
    if (!name || !["true", "false"].includes(enabled ?? ""))
      throw new ConfigurationError(`Invalid feature flag declaration: ${item}`, {
        variable: "FEATURE_FLAGS"
      });
    flags[name] = enabled === "true";
  }
  return flags;
}
function maskDatabaseUrl(value: string): string {
  const url = new URL(value);
  if (url.password) url.password = "[redacted]";
  return url.toString();
}
