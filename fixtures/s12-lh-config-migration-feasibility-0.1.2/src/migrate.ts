import type { SchemaV1Configuration } from "./schema-v1.js";
import type { SchemaV2Configuration } from "./schema-v2.js";

export function migrateConfiguration(_input: SchemaV1Configuration): SchemaV2Configuration {
  throw new Error("TODO: implement the frozen v1-to-v2 migration");
}
