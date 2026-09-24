import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));

test("M1 schema accepts valid v2 and rejects invalid/v1 shapes", async () => {
  const { isSchemaV2 } = await import("../dist/schema-v2.js");
  assert.equal(isSchemaV2(await json("../examples/expected-v2.json")), true);
  assert.equal(isSchemaV2(await json("../examples/invalid-v1.json")), false);
  assert.equal(isSchemaV2(await json("../examples/valid-v1.json")), false);
});

test("M2 migration produces the frozen canonical v2 shape", async () => {
  const { migrateConfiguration } = await import("../dist/migrate.js");
  assert.deepEqual(
    migrateConfiguration(await json("../examples/valid-v1.json")),
    await json("../examples/expected-v2.json")
  );
  assert.throws(() => migrateConfiguration({ schemaVersion: "invalid" }));
});

test("M3 migration preserves protected fields and input immutability", async () => {
  const { migrateConfiguration } = await import("../dist/migrate.js");
  const input = await json("../examples/valid-v1.json");
  const before = clone(input);
  const output = migrateConfiguration(input);
  assert.deepEqual(input, before);
  assert.equal(output.project.id, input.projectId);
  assert.deepEqual(
    output.services.map((service) => service.serviceId),
    input.services.map((service) => service.id)
  );
  assert.deepEqual(
    output.services.map((service) => service.environment),
    input.services.map((service) => service.environment)
  );
  assert.deepEqual(
    output.services.map((service) => service.runtime.command),
    input.services.map((service) => service.command)
  );
});

test("M4 CLI returns canonical output and rejects invalid input", async () => {
  const valid = spawnSync(process.execPath, ["dist/cli.js", "examples/valid-v1.json"], {
    encoding: "utf8"
  });
  const invalid = spawnSync(process.execPath, ["dist/cli.js", "examples/invalid-v1.json"], {
    encoding: "utf8"
  });
  assert.equal(valid.status, 0);
  assert.deepEqual(JSON.parse(valid.stdout), await json("../examples/expected-v2.json"));
  assert.notEqual(invalid.status, 0);
  assert.equal(invalid.stderr.length > 0, true);
});

test("M6 documentation states identity and bounded limitations", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /s12_lh_config_migration_feasibility@0\.1\.1/);
  assert.match(readme, /synthetic/i);
  assert.match(readme, /incomplete/i);
});
