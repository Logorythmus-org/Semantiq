import assert from "node:assert/strict";
import { test } from "node:test";

import { getMessage } from "../src/message.mjs";

test("pipeline task changes getMessage from alpha to beta", () => {
  assert.equal(getMessage(), "beta");
});
