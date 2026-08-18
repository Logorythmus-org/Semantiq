/**
 * @package @semantiq/patterns
 * Deterministic Pattern Graph
 */

import { RelationType } from "../../sandbox-contracts/src/index.js";
import { SEED_RELATIONS } from "./seeds.js";
import type { PatternRelation } from "./types.js";

export class PatternGraph {
  private readonly relations = new Map<string, PatternRelation>();
  private readonly adjacency = new Map<string, Set<string>>();
  private readonly reverseAdjacency = new Map<string, Set<string>>();

  constructor(initialRelations: readonly PatternRelation[] = SEED_RELATIONS) {
    for (const rel of initialRelations) {
      this.addRelation(rel);
    }
  }

  public addRelation(relation: PatternRelation): void {
    this.relations.set(relation.id, relation);

    if (!this.adjacency.has(relation.sourceId)) {
      this.adjacency.set(relation.sourceId, new Set());
    }
    this.adjacency.get(relation.sourceId)!.add(relation.targetId);

    if (!this.reverseAdjacency.has(relation.targetId)) {
      this.reverseAdjacency.set(relation.targetId, new Set());
    }
    this.reverseAdjacency.get(relation.targetId)!.add(relation.sourceId);
  }

  public getRelationsFrom(sourceId: string): readonly PatternRelation[] {
    return Array.from(this.relations.values()).filter((r) => r.sourceId === sourceId);
  }

  public getRelationsTo(targetId: string): readonly PatternRelation[] {
    return Array.from(this.relations.values()).filter((r) => r.targetId === targetId);
  }

  public getOutgoingTargets(sourceId: string): readonly string[] {
    return Array.from(this.adjacency.get(sourceId) ?? []);
  }

  public getIncomingSources(targetId: string): readonly string[] {
    return Array.from(this.reverseAdjacency.get(targetId) ?? []);
  }

  public findMitigationsForRisk(riskPatternId: string): readonly PatternRelation[] {
    // Finds design patterns that REFUTE or MITIGATE this risk pattern
    return Array.from(this.relations.values()).filter(
      (r) => r.targetId === riskPatternId && r.type === RelationType.REFUTES
    );
  }

  public findEvaluatorsForPattern(patternId: string): readonly PatternRelation[] {
    return Array.from(this.relations.values()).filter(
      (r) => r.targetId === patternId && r.type === RelationType.EVALUATES
    );
  }

  public getAllRelations(): readonly PatternRelation[] {
    return Array.from(this.relations.values());
  }

  public size(): number {
    return this.relations.size;
  }
}
