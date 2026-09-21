import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  S12_EVIDENCE_AUTHORITY,
  S12_FEASIBILITY_AUTHORITY,
  type S12MilestoneOutcome
} from "./s12-openrouter-feasibility.js";

export const S12_VERIFIER_ID = "s12_config_migration_final_state_verifier";
export const S12_VERIFIER_VERSION = "0.2.0";

export interface S12VerifierCommandResult {
  readonly command: string;
  readonly exitCode: number;
  readonly stdoutDigest: string;
  readonly stderrDigest: string;
}

export interface S12VerifierRuntime {
  verifierMaterialDigest(): Promise<string>;
  artifactExists(path: string): Promise<boolean>;
  execute(command: string): Promise<S12VerifierCommandResult>;
}

export interface S12MilestoneVerification {
  readonly milestoneId: string;
  readonly critical: boolean;
  readonly outcome: S12MilestoneOutcome;
  readonly verifierId: typeof S12_VERIFIER_ID;
  readonly verifierVersion: typeof S12_VERIFIER_VERSION;
  readonly commands: readonly S12VerifierCommandResult[];
  readonly artifactReferences: readonly string[];
  readonly failure?: string | undefined;
}

export interface S12FinalStateVerification {
  readonly verifierId: typeof S12_VERIFIER_ID;
  readonly verifierVersion: typeof S12_VERIFIER_VERSION;
  readonly verifierIntegrity: "VERIFIED" | "FAILED";
  readonly milestones: readonly S12MilestoneVerification[];
  readonly criterion: S12MilestoneOutcome;
  readonly authority: typeof S12_EVIDENCE_AUTHORITY;
  readonly scientificAuthority: typeof S12_FEASIBILITY_AUTHORITY;
  readonly verificationDigest: string;
}

const DEFINITIONS = [
  {
    id: "M1",
    critical: true,
    artifacts: ["src/schema-v2.ts", "examples/valid-v1.json", "examples/invalid-v1.json"],
    commands: ["pnpm verify:schema"]
  },
  { id: "M2", critical: true, artifacts: ["src/migrate.ts"], commands: ["pnpm verify:migration"] },
  {
    id: "M3",
    critical: true,
    artifacts: ["src/migrate.ts"],
    commands: ["pnpm verify:preservation"]
  },
  { id: "M4", critical: true, artifacts: ["src/cli.ts"], commands: ["pnpm verify:cli"] },
  {
    id: "M5",
    critical: true,
    artifacts: ["package.json", "tsconfig.json"],
    commands: ["pnpm build", "pnpm typecheck", "pnpm verify"]
  },
  {
    id: "M6",
    critical: false,
    artifacts: ["README.md", "TASK.md"],
    commands: ["pnpm verify:documentation"]
  }
] as const;

export class S12FinalStateVerifier {
  constructor(private readonly authoritativeVerifierDigest: string) {}

  async verify(runtime: S12VerifierRuntime): Promise<S12FinalStateVerification> {
    const actualDigest = await runtime.verifierMaterialDigest();
    if (actualDigest !== this.authoritativeVerifierDigest)
      return this.finish(
        "FAILED",
        DEFINITIONS.map((definition) =>
          milestone(
            definition.id,
            definition.critical,
            "UNVERIFIABLE",
            [],
            definition.artifacts,
            "VERIFIER_INTEGRITY_FAILURE"
          )
        )
      );

    const milestones: S12MilestoneVerification[] = [];
    for (const definition of DEFINITIONS) {
      const artifactStates = await Promise.all(
        definition.artifacts.map((artifact) => runtime.artifactExists(artifact))
      );
      if (artifactStates.some((exists) => !exists)) {
        milestones.push(
          milestone(
            definition.id,
            definition.critical,
            "NOT_SATISFIED",
            [],
            definition.artifacts,
            "REQUIRED_ARTIFACT_MISSING"
          )
        );
        continue;
      }
      const commands: S12VerifierCommandResult[] = [];
      try {
        for (const command of definition.commands) commands.push(await runtime.execute(command));
        milestones.push(
          milestone(
            definition.id,
            definition.critical,
            commands.every((entry) => entry.exitCode === 0) ? "SATISFIED" : "NOT_SATISFIED",
            commands,
            definition.artifacts
          )
        );
      } catch {
        milestones.push(
          milestone(
            definition.id,
            definition.critical,
            "UNVERIFIABLE",
            commands,
            definition.artifacts,
            "VERIFIER_EXECUTION_FAILURE"
          )
        );
      }
    }
    return this.finish("VERIFIED", milestones);
  }

  private finish(
    integrity: "VERIFIED" | "FAILED",
    milestones: readonly S12MilestoneVerification[]
  ): S12FinalStateVerification {
    const critical = milestones.filter((item) => item.critical);
    const criterion = critical.some((item) => item.outcome === "UNVERIFIABLE")
      ? "UNVERIFIABLE"
      : critical.every((item) => item.outcome === "SATISFIED")
        ? "SATISFIED"
        : "NOT_SATISFIED";
    const material = {
      verifierId: S12_VERIFIER_ID,
      verifierVersion: S12_VERIFIER_VERSION,
      verifierIntegrity: integrity,
      milestones,
      criterion,
      authority: S12_EVIDENCE_AUTHORITY,
      scientificAuthority: S12_FEASIBILITY_AUTHORITY
    } as const;
    return { ...material, verificationDigest: computeSha256(canonicalJson(material)) };
  }
}

function milestone(
  milestoneId: string,
  critical: boolean,
  outcome: S12MilestoneOutcome,
  commands: readonly S12VerifierCommandResult[],
  artifactReferences: readonly string[],
  failure?: string
): S12MilestoneVerification {
  return {
    milestoneId,
    critical,
    outcome,
    verifierId: S12_VERIFIER_ID,
    verifierVersion: S12_VERIFIER_VERSION,
    commands,
    artifactReferences,
    ...(failure ? { failure } : {})
  };
}
