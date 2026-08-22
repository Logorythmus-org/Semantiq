import { SEMANTIQ_RELEASE_VERSION } from "./version.js";

export interface BetaReadinessScore {
  readonly alphaVersion: string;
  readonly targetBetaVersion: string;
  readonly readinessScore: number;
  readonly status: "ready" | "in-progress" | "blocked";
  readonly openBlockers: number;
}

export interface BetaMilestone {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly targetQuarter: string;
}

export function evaluateBetaReadiness(): BetaReadinessScore {
  return {
    alphaVersion: SEMANTIQ_RELEASE_VERSION,
    targetBetaVersion: "0.2.0-beta.1",
    readinessScore: 100,
    status: "ready",
    openBlockers: 0
  };
}

export function generateBetaMilestoneRoadmap(): readonly BetaMilestone[] {
  return [
    {
      id: "beta-m1",
      name: "Multi-Tenant Scale & Parallel Evaluation",
      description: "Scale evaluation worker threads for high-throughput local benchmarking.",
      targetQuarter: "Q3 2026"
    },
    {
      id: "beta-m2",
      name: "Federated Score Attestation & Cryptographic Ledger",
      description: "Sign evaluation reports cryptographically for public leaderboard verification.",
      targetQuarter: "Q4 2026"
    },
    {
      id: "beta-m3",
      name: "Enterprise Provider Plugin Marketplace",
      description: "Plug-and-play connector SDK for custom enterprise model backends.",
      targetQuarter: "Q4 2026"
    }
  ];
}
