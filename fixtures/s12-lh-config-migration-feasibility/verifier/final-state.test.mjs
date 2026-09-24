import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("frozen verifier material remains readable", async () => {
  const spec = JSON.parse(await readFile(new URL("./spec.json", import.meta.url), "utf8"));
  assert.equal(spec.independence, "FINAL_REPOSITORY_STATE_ONLY");
  assert.deepEqual(Object.keys(spec.milestones), ["M1", "M2", "M3", "M4", "M5", "M6"]);
});
