/**
 * @package @semantiq/evidence
 * Pattern Candidate Review & Promotion Engine
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type { PatternRegistry } from "../../../patterns/src/index.js";
import type { CandidateReviewStatus, PatternCandidate } from "./types.js";

export interface SubmitCandidateOptions {
  readonly patternDraft: PatternCandidate["patternDraft"];
  readonly proposedBy: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly epistemicNature?: "hypothesis" | "inference";
}

export class PatternPromotionEngine {
  private readonly candidates = new Map<string, PatternCandidate>();

  constructor(private readonly patternRegistry: PatternRegistry) {}

  public submitCandidate(options: SubmitCandidateOptions): PatternCandidate {
    const candidateId = `cand_${computeSha256(`${options.patternDraft.id}:${options.proposedBy}:${Date.now()}`).substring(0, 16)}`;

    const candidate: PatternCandidate = {
      candidateId,
      patternDraft: options.patternDraft,
      proposedBy: options.proposedBy,
      sourceEvidenceIds: options.sourceEvidenceIds,
      epistemicNature: options.epistemicNature ?? "hypothesis",
      reviewStatus: "under_review" as CandidateReviewStatus,
      reviews: [],
      submittedAt: new Date().toISOString()
    };

    const frozenCandidate = Object.freeze(candidate);
    this.candidates.set(candidateId, frozenCandidate);
    return frozenCandidate;
  }

  public addReview(
    candidateId: string,
    review: {
      reviewerId: string;
      decision: "approve" | "reject" | "request_changes";
      comments: string;
    }
  ): PatternCandidate {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Pattern candidate not found: ${candidateId}`);
    }

    const newReview = {
      ...review,
      reviewedAt: new Date().toISOString()
    };

    const updatedReviews = [...candidate.reviews, newReview];
    const approveCount = updatedReviews.filter((r) => r.decision === "approve").length;
    const rejectCount = updatedReviews.filter((r) => r.decision === "reject").length;

    let newStatus: CandidateReviewStatus = candidate.reviewStatus;
    if (rejectCount > 0) {
      newStatus = "rejected";
    } else if (approveCount >= 2) {
      newStatus = "approved";
    }

    const updated: PatternCandidate = {
      ...candidate,
      reviewStatus: newStatus,
      reviews: Object.freeze(updatedReviews)
    };

    const frozen = Object.freeze(updated);
    this.candidates.set(candidateId, frozen);
    return frozen;
  }

  /**
   * Promotes an approved PatternCandidate into the canonical PatternRegistry.
   */
  public promoteCandidate(candidateId: string): PatternCandidate {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Pattern candidate not found: ${candidateId}`);
    }

    if (candidate.reviewStatus !== "approved") {
      throw new Error(
        `Cannot promote candidate ${candidateId} with status '${candidate.reviewStatus}'. Must be 'approved'.`
      );
    }

    // Register pattern in canonical PatternRegistry
    this.patternRegistry.register(candidate.patternDraft);

    const promoted: PatternCandidate = {
      ...candidate,
      approvedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(promoted);
    this.candidates.set(candidateId, frozen);
    return frozen;
  }

  public getCandidate(candidateId: string): PatternCandidate | undefined {
    return this.candidates.get(candidateId);
  }

  public listCandidates(status?: CandidateReviewStatus): readonly PatternCandidate[] {
    const all = Array.from(this.candidates.values());
    if (status) {
      return all.filter((c) => c.reviewStatus === status);
    }
    return all;
  }
}
