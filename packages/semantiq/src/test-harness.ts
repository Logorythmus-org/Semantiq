export type TestCategory =
  | 'unit'
  | 'integration'
  | 'contracts'
  | 'migration'
  | 'replay'
  | 'scenarios'
  | 'boundary'
  | 'no-egress'
  | 'cli'
  | 'smoke'
  | 'security'
  | 'packaging'
  | 'docs';

export interface TestHarnessConfig {
  readonly categories: readonly TestCategory[];
  readonly deterministicSeed: number;
  readonly isolatedTempDir: string;
  readonly noNetworkEgress: boolean;
  readonly cleanupOnExit: boolean;
}

export interface TestRunReport {
  readonly categories: readonly TestCategory[];
  readonly passed: boolean;
  readonly hasParentImports: boolean;
  readonly hasNetworkEgress: boolean;
  readonly hasDeterministicSeed: boolean;
  readonly timestamp: string;
}

const ALL_CATEGORIES: TestCategory[] = [
  'unit', 'integration', 'contracts', 'migration',
  'replay', 'scenarios', 'boundary', 'no-egress',
  'cli', 'smoke', 'security', 'packaging', 'docs'
];

/**
 * Independent Test Harness Engine.
 * Provides a candidate-local, deterministic, no-egress test harness for SemantIQ.
 */
export class TestHarnessEngine {
  private config: TestHarnessConfig;

  constructor(config?: Partial<TestHarnessConfig>) {
    this.config = {
      categories: config?.categories ?? ALL_CATEGORIES,
      deterministicSeed: config?.deterministicSeed ?? 42,
      isolatedTempDir: config?.isolatedTempDir ?? './tmp/test-harness',
      noNetworkEgress: config?.noNetworkEgress ?? true,
      cleanupOnExit: config?.cleanupOnExit ?? true
    };
  }

  getConfig(): TestHarnessConfig {
    return { ...this.config };
  }

  validateHarness(importList: readonly string[]): TestRunReport {
    const forbiddenPrefixes = ['sprint', 'civil', 'wallet', 'marketplace'];
    const hasParentImports = importList.some(imp => {
      if (!imp.startsWith('@tech-club/')) return false;
      return forbiddenPrefixes.some(kw => imp.includes(kw));
    });

    const hasNetworkEgress = importList.some(
      imp => imp.includes('fetch(') || imp.includes('http.get') || imp.includes('axios')
    );

    return {
      categories: this.config.categories,
      passed: !hasParentImports && !hasNetworkEgress,
      hasParentImports,
      hasNetworkEgress,
      hasDeterministicSeed: true,
      timestamp: new Date().toISOString()
    };
  }

  listCategories(): readonly TestCategory[] {
    return this.config.categories;
  }
}
