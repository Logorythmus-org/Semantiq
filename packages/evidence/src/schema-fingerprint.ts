/**
 * @package @semantiq/evidence
 * Deterministic Schema Fingerprint Calculator
 */

import { computeSha256 } from "../../sandbox-contracts/src/index.js";

export class SchemaFingerprint {
  /**
   * Computes a deterministic SHA-256 fingerprint for a schema descriptor or sample payload shape.
   */
  public static computeFromShape(sample: Record<string, unknown>): string {
    const keys = Object.keys(sample).sort();
    const shapeSummary = keys.map((key) => {
      const val = sample[key];
      const type = Array.isArray(val) ? "array" : typeof val;
      return `${key}:${type}`;
    });
    return computeSha256(shapeSummary.join("|"));
  }

  /**
   * Computes a deterministic SHA-256 fingerprint for a list of event samples.
   */
  public static computeFromEventStream(events: readonly Record<string, unknown>[]): string {
    const allKeys = new Set<string>();
    const types: string[] = [];

    for (const evt of events) {
      for (const k of Object.keys(evt)) {
        allKeys.add(k);
      }
      if (typeof evt["type"] === "string" || typeof evt["event"] === "string") {
        types.push(String(evt["type"] ?? evt["event"]));
      }
    }

    const sortedKeys = Array.from(allKeys).sort();
    const sortedTypes = Array.from(new Set(types)).sort();
    return computeSha256(`${sortedKeys.join(",")};types=${sortedTypes.join(",")}`);
  }
}
