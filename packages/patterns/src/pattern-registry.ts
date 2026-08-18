/**
 * @package @semantiq/patterns
 * Pattern Registry
 */

import type { PatternCategory } from "../../sandbox-contracts/src/index.js";
import { SEED_PATTERNS } from "./seeds.js";
import type { PatternDefinition } from "./types.js";

export class PatternRegistry {
  private readonly patterns = new Map<string, PatternDefinition>();

  constructor(initialPatterns: readonly PatternDefinition[] = SEED_PATTERNS) {
    for (const pat of initialPatterns) {
      this.register(pat);
    }
  }

  public register(pattern: PatternDefinition): void {
    this.patterns.set(pattern.id, pattern);
    // Also index by code (e.g. "DP-001")
    this.patterns.set(pattern.code, pattern);
  }

  public getById(id: string): PatternDefinition | undefined {
    return this.patterns.get(id);
  }

  public getByCode(code: string): PatternDefinition | undefined {
    return this.patterns.get(code);
  }

  public getAllUnique(): readonly PatternDefinition[] {
    const seen = new Set<string>();
    const result: PatternDefinition[] = [];
    for (const pat of this.patterns.values()) {
      if (!seen.has(pat.id)) {
        seen.add(pat.id);
        result.push(pat);
      }
    }
    return result;
  }

  public getByCategory(category: PatternCategory | string): readonly PatternDefinition[] {
    return this.getAllUnique().filter((p) => (p.category as string) === (category as string));
  }

  public size(): number {
    return this.getAllUnique().length;
  }
}
