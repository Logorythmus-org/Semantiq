export interface SchemaV1Service {
  readonly id: string;
  readonly command: string;
  readonly environment: Readonly<Record<string, string>>;
}

export interface SchemaV1Configuration {
  readonly schemaVersion: "1";
  readonly projectId: string;
  readonly services: readonly SchemaV1Service[];
}

export function isSchemaV1(value: unknown): value is SchemaV1Configuration {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    input["schemaVersion"] === "1" &&
    typeof input["projectId"] === "string" &&
    Array.isArray(input["services"])
  );
}
