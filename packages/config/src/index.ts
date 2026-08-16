import { ConfigurationError } from "../../shared/src/index.js";

export * from "./settings.js";

export type { ConfigurationService } from "../../core/src/index.js";

export type TechClubEnvironment = "local" | "test" | "docker";
export type NodeEnvironment = "development" | "test" | "production";

export interface TechClubConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly techclubEnv: TechClubEnvironment;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly neo4jUri: string;
  readonly neo4jUser: string;
  readonly neo4jPassword: string;
  readonly minioEndpoint: string;
  readonly minioAccessKey: string;
  readonly minioSecretKey: string;
  readonly otelExporterOtlpEndpoint?: string | undefined;
}

export type ConfigSource = Record<string, string | undefined>;

const defaults: TechClubConfig = {
  nodeEnv: "development",
  techclubEnv: "local",
  databaseUrl: "postgresql://techclub:techclub@localhost:5432/techclub",
  redisUrl: "redis://localhost:6379",
  neo4jUri: "bolt://localhost:7687",
  neo4jUser: "neo4j",
  neo4jPassword: "techclub-local",
  minioEndpoint: "http://localhost:9000",
  minioAccessKey: "techclub",
  minioSecretKey: "techclub-local"
};

export function loadTechClubConfig(source: ConfigSource = process.env): TechClubConfig {
  const config: TechClubConfig = {
    nodeEnv: parseNodeEnv(source.NODE_ENV ?? defaults.nodeEnv),
    techclubEnv: parseTechClubEnv(source.TECHCLUB_ENV ?? defaults.techclubEnv),
    databaseUrl: readUrl(source.DATABASE_URL ?? defaults.databaseUrl, "DATABASE_URL", [
      "postgresql:",
      "postgres:"
    ]),
    redisUrl: readUrl(source.REDIS_URL ?? defaults.redisUrl, "REDIS_URL", ["redis:"]),
    neo4jUri: readUrl(source.NEO4J_URI ?? defaults.neo4jUri, "NEO4J_URI", ["bolt:", "neo4j:"]),
    neo4jUser: readNonEmpty(source.NEO4J_USER ?? defaults.neo4jUser, "NEO4J_USER"),
    neo4jPassword: readNonEmpty(source.NEO4J_PASSWORD ?? defaults.neo4jPassword, "NEO4J_PASSWORD"),
    minioEndpoint: readUrl(source.MINIO_ENDPOINT ?? defaults.minioEndpoint, "MINIO_ENDPOINT", [
      "http:",
      "https:"
    ]),
    minioAccessKey: readNonEmpty(
      source.MINIO_ACCESS_KEY ?? defaults.minioAccessKey,
      "MINIO_ACCESS_KEY"
    ),
    minioSecretKey: readNonEmpty(
      source.MINIO_SECRET_KEY ?? defaults.minioSecretKey,
      "MINIO_SECRET_KEY"
    ),
    otelExporterOtlpEndpoint: source.OTEL_EXPORTER_OTLP_ENDPOINT
      ? readUrl(source.OTEL_EXPORTER_OTLP_ENDPOINT, "OTEL_EXPORTER_OTLP_ENDPOINT", [
          "http:",
          "https:"
        ])
      : undefined
  };

  if (config.nodeEnv === "production") {
    throw new ConfigurationError(
      "Production configuration is intentionally unsupported in the local-first baseline.",
      {
        variable: "NODE_ENV"
      }
    );
  }

  return config;
}

export function requireConfig(source: ConfigSource, variableName: string): string {
  return readNonEmpty(source[variableName], variableName);
}

function parseNodeEnv(value: string): NodeEnvironment {
  if (value === "development" || value === "test" || value === "production") return value;
  throw new ConfigurationError(`Invalid NODE_ENV: ${value}`, {
    variable: "NODE_ENV",
    allowed: ["development", "test", "production"]
  });
}

function parseTechClubEnv(value: string): TechClubEnvironment {
  if (value === "local" || value === "test" || value === "docker") return value;
  throw new ConfigurationError(`Invalid TECHCLUB_ENV: ${value}`, {
    variable: "TECHCLUB_ENV",
    allowed: ["local", "test", "docker"]
  });
}

function readNonEmpty(value: string | undefined, variableName: string): string {
  if (!value || value.trim().length === 0) {
    throw new ConfigurationError(`Missing required configuration variable: ${variableName}`, {
      variable: variableName
    });
  }
  return value;
}

function readUrl(value: string, variableName: string, allowedProtocols: readonly string[]): string {
  try {
    const parsed = new URL(readNonEmpty(value, variableName));
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new ConfigurationError(`Invalid protocol for ${variableName}: ${parsed.protocol}`, {
        variable: variableName,
        allowedProtocols
      });
    }
    return value;
  } catch (error) {
    if (error instanceof ConfigurationError) throw error;
    throw new ConfigurationError(`Invalid URL for ${variableName}`, { variable: variableName });
  }
}

// Canonical SemantIQ Config Aliases
export type SemantiqConfig = TechClubConfig;
export const loadSemantiqConfig = loadTechClubConfig;
export type { SemantiqSettings } from "./settings.js";
export { loadSemantiqSettings, diagnoseSemantiqSettings } from "./settings.js";
