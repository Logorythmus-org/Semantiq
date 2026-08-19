/**
 * @package @semantiq/patterns
 * System Pattern Matcher & Recommender
 *
 * Invariant: Relevance is not probability. Relevance is a deterministic rule-grounded score.
 */

import type { SystemProfile } from "../../sandbox-contracts/src/index.js";
import type { PatternGraph } from "./pattern-graph.js";
import type { PatternRegistry } from "./pattern-registry.js";
import type { PatternDefinition, PatternRecommendation, SystemMatchResult } from "./types.js";

export class SystemPatternMatcher {
  constructor(
    private readonly registry: PatternRegistry,
    private readonly graph: PatternGraph
  ) {}

  /**
   * Deterministically evaluates the SystemProfile against all registered patterns.
   */
  public matchSystem(profile: SystemProfile): SystemMatchResult {
    const applicableDesignPatterns: PatternRecommendation[] = [];
    const detectedRiskPatterns: PatternRecommendation[] = [];
    const suggestedTestingPatterns: PatternRecommendation[] = [];

    const allPatterns = this.registry.getAllUnique();

    for (const pat of allPatterns) {
      if (pat.code.startsWith("DP-")) {
        const relevance = this.calculateDesignPatternRelevance(profile, pat);
        if (relevance > 0.5) {
          applicableDesignPatterns.push({
            pattern: pat,
            relevanceScore: Number(relevance.toFixed(3)),
            reason: `System capabilities align with ${pat.name} requirements.`,
            category: "recommended_design"
          });
        }
      } else if (pat.code.startsWith("FP-")) {
        const riskScore = this.calculateRiskExposureScore(profile, pat);
        if (riskScore > 0.4) {
          detectedRiskPatterns.push({
            pattern: pat,
            relevanceScore: Number(riskScore.toFixed(3)),
            reason: `Profile attributes expose risk of ${pat.name}.`,
            category: "risk_warning"
          });
        }
      } else if (pat.code.startsWith("TP-")) {
        const testRelevance = this.calculateTestRelevance(profile, pat);
        if (testRelevance > 0.5) {
          suggestedTestingPatterns.push({
            pattern: pat,
            relevanceScore: Number(testRelevance.toFixed(3)),
            reason: `Recommended test harness to evaluate system boundaries.`,
            category: "suggested_test"
          });
        }
      }
    }

    // Sort deterministically by relevance descending, then pattern code ascending
    const sortFn = (a: PatternRecommendation, b: PatternRecommendation) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.pattern.code.localeCompare(b.pattern.code);
    };

    applicableDesignPatterns.sort(sortFn);
    detectedRiskPatterns.sort(sortFn);
    suggestedTestingPatterns.sort(sortFn);

    const overallRiskIndex =
      detectedRiskPatterns.length > 0
        ? Number(
            (
              detectedRiskPatterns.reduce((sum, r) => sum + r.relevanceScore, 0) /
              detectedRiskPatterns.length
            ).toFixed(3)
          )
        : 0.0;

    return {
      systemProfileId: profile.id,
      applicableDesignPatterns,
      detectedRiskPatterns,
      suggestedTestingPatterns,
      overallRiskIndex
    };
  }

  private calculateDesignPatternRelevance(
    profile: SystemProfile,
    pattern: PatternDefinition
  ): number {
    let score = 0.5;
    const req = pattern.detectionRule.requiredCapabilities ?? [];
    if (req.length > 0) {
      const matchCount = req.filter((c) => profile.capabilities.includes(c)).length;
      score = matchCount / req.length;
    }

    if (pattern.code === "DP-002" && profile.contextWindowTokens >= 32000) {
      score = Math.max(score, 0.95);
    }
    if (pattern.code === "DP-007") {
      score = 1.0; // Epistemic distinction is universally applicable
    }

    return score;
  }

  private calculateRiskExposureScore(profile: SystemProfile, pattern: PatternDefinition): number {
    let risk = 0.3;

    if (pattern.code === "FP-001") {
      // Risk of shortcut evasion is high if agent has code execution or multi-turn capabilities
      if (profile.capabilities.includes("code_execution")) risk += 0.4;
      if (profile.capabilities.includes("tool_calling")) risk += 0.2;
    } else if (pattern.code === "FP-002") {
      // Unbounded context drift risk increases with larger context windows and multi-turn
      if (profile.contextWindowTokens >= 64000) risk += 0.35;
      if (profile.capabilities.includes("multi_turn")) risk += 0.35;
    } else if (pattern.code === "FP-003") {
      // Tool injection vulnerability risk exists when tool calling is enabled
      if (
        profile.capabilities.includes("tool_calling") ||
        profile.capabilities.includes("code_execution")
      ) {
        risk = 0.85;
      }
    } else if (pattern.code === "FP-006") {
      // Hallucinated citations risk
      risk = 0.65;
    }

    return Math.min(1.0, risk);
  }

  private calculateTestRelevance(profile: SystemProfile, pattern: PatternDefinition): number {
    if (pattern.code === "TP-001") {
      return profile.capabilities.includes("tool_calling") ||
        profile.capabilities.includes("multi_turn")
        ? 0.95
        : 0.7;
    }
    return 0.8;
  }
}
