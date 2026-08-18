/**
 * @package @semantiq/patterns
 * Test Definition, Test Registry, and Test Planner
 */

import type { SystemProfile } from "../../sandbox-contracts/src/index.js";
import { SEED_TEST_DEFINITIONS } from "./seeds.js";
import type { SystemPatternMatcher } from "./system-pattern-matcher.js";
import type { TestDefinition } from "./types.js";

export class TestRegistry {
  private readonly tests = new Map<string, TestDefinition>();

  constructor(initialTests: readonly TestDefinition[] = SEED_TEST_DEFINITIONS) {
    for (const t of initialTests) {
      this.register(t);
    }
  }

  public register(test: TestDefinition): void {
    this.tests.set(test.id, test);
  }

  public getById(id: string): TestDefinition | undefined {
    return this.tests.get(id);
  }

  public getByPatternId(patternId: string): readonly TestDefinition[] {
    return Array.from(this.tests.values()).filter((t) => t.patternId === patternId);
  }

  public getAll(): readonly TestDefinition[] {
    return Array.from(this.tests.values());
  }
}

export class TestPlanner {
  constructor(
    private readonly testRegistry: TestRegistry,
    private readonly patternMatcher: SystemPatternMatcher
  ) {}

  public planTestsForProfile(profile: SystemProfile): readonly TestDefinition[] {
    const match = this.patternMatcher.matchSystem(profile);
    const planned = new Map<string, TestDefinition>();

    // 1. Direct suggested test patterns
    for (const testRec of match.suggestedTestingPatterns) {
      const tests = this.testRegistry.getByPatternId(testRec.pattern.id);
      for (const t of tests) {
        planned.set(t.id, t);
      }
    }

    // 2. High-risk patterns get corresponding stress test definitions
    for (const risk of match.detectedRiskPatterns) {
      if (risk.relevanceScore >= 0.7) {
        // Find if TP-001 or any test exists that evaluates this risk
        const allTests = this.testRegistry.getAll();
        for (const t of allTests) {
          planned.set(t.id, t);
        }
      }
    }

    return Array.from(planned.values());
  }
}
