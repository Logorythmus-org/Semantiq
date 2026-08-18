/**
 * @package @semantiq/patterns
 * Pattern Recommender
 */

import type { SystemProfile } from "../../sandbox-contracts/src/index.js";
import type { PatternGraph } from "./pattern-graph.js";
import type { PatternRegistry } from "./pattern-registry.js";
import { SystemPatternMatcher } from "./system-pattern-matcher.js";
import type { PatternRecommendation } from "./types.js";

export class PatternRecommender {
  private readonly matcher: SystemPatternMatcher;

  constructor(
    private readonly registry: PatternRegistry,
    private readonly graph: PatternGraph
  ) {
    this.matcher = new SystemPatternMatcher(registry, graph);
  }

  public recommendForProfile(profile: SystemProfile): readonly PatternRecommendation[] {
    const match = this.matcher.matchSystem(profile);
    const recommendations: PatternRecommendation[] = [
      ...match.applicableDesignPatterns,
      ...match.detectedRiskPatterns,
      ...match.suggestedTestingPatterns
    ];

    // For every detected risk pattern, look up in PatternGraph for known design pattern mitigations!
    for (const risk of match.detectedRiskPatterns) {
      const mitigations = this.graph.findMitigationsForRisk(risk.pattern.id);
      for (const rel of mitigations) {
        const mitPattern = this.registry.getById(rel.sourceId);
        if (mitPattern && !recommendations.some((r) => r.pattern.id === mitPattern.id)) {
          recommendations.push({
            pattern: mitPattern,
            relevanceScore: Number((risk.relevanceScore * rel.weight).toFixed(3)),
            reason: `Direct mitigation for ${risk.pattern.code} (${risk.pattern.name}): ${rel.rationale}`,
            category: "recommended_design"
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
