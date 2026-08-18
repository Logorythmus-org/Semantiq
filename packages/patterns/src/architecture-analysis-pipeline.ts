/**
 * @package @semantiq/patterns
 * Architecture Analysis Pipeline
 */

import { computeSha256, type SystemProfile } from "../../sandbox-contracts/src/index.js";
import { PatternGraph } from "./pattern-graph.js";
import { PatternRecommender } from "./pattern-recommender.js";
import { PatternRegistry } from "./pattern-registry.js";
import { SystemPatternMatcher } from "./system-pattern-matcher.js";
import { TestPlanner, TestRegistry } from "./test-planner.js";
import type { ArchitectureAnalysisReport } from "./types.js";

export class ArchitectureAnalysisPipeline {
  private readonly registry: PatternRegistry;
  private readonly graph: PatternGraph;
  private readonly matcher: SystemPatternMatcher;
  private readonly recommender: PatternRecommender;
  private readonly testRegistry: TestRegistry;
  private readonly testPlanner: TestPlanner;

  constructor(
    registry: PatternRegistry = new PatternRegistry(),
    graph: PatternGraph = new PatternGraph(),
    testRegistry: TestRegistry = new TestRegistry()
  ) {
    this.registry = registry;
    this.graph = graph;
    this.testRegistry = testRegistry;
    this.matcher = new SystemPatternMatcher(this.registry, this.graph);
    this.recommender = new PatternRecommender(this.registry, this.graph);
    this.testPlanner = new TestPlanner(this.testRegistry, this.matcher);
  }

  public analyzeArchitecture(profile: SystemProfile): ArchitectureAnalysisReport {
    const timestamp = new Date().toISOString();
    const reportId = `arch_rep_${computeSha256(`${profile.id}-${timestamp}`).substring(0, 16)}`;

    const matches = this.matcher.matchSystem(profile);
    const recommendations = this.recommender.recommendForProfile(profile);
    const activeRelations = this.graph.getAllRelations();
    const plannedTests = this.testPlanner.planTestsForProfile(profile);

    return {
      reportId,
      systemProfile: profile,
      matches,
      recommendations,
      activeRelations,
      plannedTests,
      generatedAt: timestamp
    };
  }

  public getRegistry(): PatternRegistry {
    return this.registry;
  }

  public getGraph(): PatternGraph {
    return this.graph;
  }

  public getTestRegistry(): TestRegistry {
    return this.testRegistry;
  }
}
