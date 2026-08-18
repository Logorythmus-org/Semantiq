/**
 * @package @tech-club/semantiq
 * Authoritative Patterns Application Service
 */

import type { SystemProfile } from "../../../sandbox-contracts/src/index.js";
import {
  PatternGraph,
  PatternRecommender,
  PatternRegistry,
  SystemPatternMatcher,
  TestPlanner,
  TestRegistry,
  type PatternDefinition,
  type PatternRecommendation,
  type PatternRelation,
  type SystemMatchResult,
  type TestDefinition
} from "../../../patterns/src/index.js";

export class PatternsService {
  public readonly registry = new PatternRegistry();
  public readonly graph = new PatternGraph();
  public readonly testRegistry = new TestRegistry();
  private readonly matcher: SystemPatternMatcher;
  private readonly recommender: PatternRecommender;
  private readonly testPlanner: TestPlanner;

  constructor() {
    this.matcher = new SystemPatternMatcher(this.registry, this.graph);
    this.recommender = new PatternRecommender(this.registry, this.graph);
    this.testPlanner = new TestPlanner(this.testRegistry, this.matcher);
  }

  public async registerPattern(pattern: PatternDefinition): Promise<void> {
    this.registry.register(pattern);
  }

  public async registerRelation(relation: PatternRelation): Promise<void> {
    this.graph.addRelation(relation);
  }

  public async getPattern(code: string): Promise<PatternDefinition | undefined> {
    return this.registry.getByCode(code);
  }

  public async listPatterns(category?: string): Promise<readonly PatternDefinition[]> {
    if (category) {
      return this.registry.getByCategory(category);
    }
    return this.registry.getAllUnique();
  }

  public async matchSystem(profile: SystemProfile): Promise<SystemMatchResult> {
    return this.matcher.matchSystem(profile);
  }

  public async recommendPatterns(
    profile: SystemProfile
  ): Promise<readonly PatternRecommendation[]> {
    return this.recommender.recommendForProfile(profile);
  }

  public async planTests(profile: SystemProfile): Promise<readonly TestDefinition[]> {
    return this.testPlanner.planTestsForProfile(profile);
  }
}
