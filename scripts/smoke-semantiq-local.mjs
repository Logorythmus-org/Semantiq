#!/usr/bin/env node
/**
 * End-to-end smoke against a running *local* SemantIQ HTTP server.
 * Checks live responses; does not create evidence claims or use remote providers.
 */
import assert from "node:assert/strict";

const baseUrl = (process.env.SEMANTIQ_SMOKE_URL ?? "http://127.0.0.1:8080").replace(
  /\/$/,
  ""
);

async function getJson(path) {
  const response = await fetch(baseUrl + path, {
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(response.status, 200, path + " must return HTTP 200");
  const payload = await response.json();
  assert.equal(payload.success, true, path + " must use the SemantIQ envelope");
  return payload;
}

async function waitForHealth() {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      return await getJson("/health");
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("SemantIQ HTTP health was not ready: " + String(lastError));
}

const health = await waitForHealth();
assert.equal(health.data.status, "healthy");
assert.equal(health.data.maturity, "Public Alpha (Experimental)");
assert.equal(health.data.releaseVersion, "0.1.0-alpha.2");
assert.equal(health.data.schemaVersion, "1.0.0");

const info = await getJson("/info");
assert.equal(info.data.product, "SemantIQ");
assert.equal(info.data.headless, true);
assert.equal(info.data.staticServing, false);
assert.ok(info.data.services.includes("claims"));

console.log(
  JSON.stringify(
    {
      result: "PASS",
      scope: "LOCAL_CONTAINER_SMOKE_ONLY",
      baseUrl,
      endpoints: ["/health", "/info"],
      releaseVersion: health.data.releaseVersion,
      schemaVersion: health.data.schemaVersion,
      maturity: health.data.maturity
    },
    null,
    2
  )
);
