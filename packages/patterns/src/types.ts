/**
 * @package @semantiq/patterns
 * Pattern Domain Core Types
 */

import type {
  PatternCategory,
  PatternSeverity,
  EvidenceConfidence,
  RelationType,
  EpistemicNature,
  SystemProfile
} from "../../sandbox-contracts/src/index.js";

export interface PatternDefinition {
  readonly id: string;
  readonly code: string; // e.g. "DP-001", "FP-001", "TP-001"
  readonly version: string;
  readonly name: string;
  readonly category: PatternCategory;
  readonly description: string;
  readonly detectionRule: {
    readonly kind: string;
    readonly expression: string;
    readonly threshold?: number;
    readonly requiredCapabilities?: readonly string[];
  };
  readonly severity: PatternSeverity;
  readonly confidence: EvidenceConfidence;
  readonly mitigations?: readonly string[];
  readonly tags: readonly string[];
}

export interface PatternRelation {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: RelationType;
  readonly weight: number; // 0.0 to 1.0 deterministic relation strength
  readonly nature: EpistemicNature;
  readonly rationale: string;
}

export interface PatternRecommendation {
  readonly pattern: PatternDefinition;
  readonly relevanceScore: number; // 0.0 to 1.0 deterministic relevance (NOT a probability)
  readonly reason: string;
  readonly category: "recommended_design" | "risk_warning" | "suggested_test";
}

export interface SystemMatchResult {
  readonly systemProfileId: string;
  readonly applicableDesignPatterns: readonly PatternRecommendation[];
  readonly detectedRiskPatterns: readonly PatternRecommendation[];
  readonly suggestedTestingPatterns: readonly PatternRecommendation[];
  readonly overallRiskIndex: number;
}

export interface TestDefinition {
  readonly id: string;
  readonly patternId: string;
  readonly name: string;
  readonly targetBenchmarkId: string;
  readonly minPassScore: number;
  readonly stepBudget: number;
  readonly timeoutMs: number;
  readonly verificationStrategy: string;
}

export interface ArchitectureAnalysisReport {
  readonly reportId: string;
  readonly systemProfile: SystemProfile;
  readonly matches: SystemMatchResult;
  readonly recommendations: readonly PatternRecommendation[];
  readonly activeRelations: readonly PatternRelation[];
  readonly plannedTests: readonly TestDefinition[];
  readonly generatedAt: string;
}
