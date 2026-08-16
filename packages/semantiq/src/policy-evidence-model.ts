import type { EvidenceChecksum } from "./event-schema.js";

export type PolicyLifecycleState =
  | "draft"
  | "proposed"
  | "active"
  | "deprecated"
  | "revoked"
  | "expired";

export type PolicyFailureClass =
  | "conflicting_versions"
  | "missing_provenance"
  | "silent_natural_language_to_rule_conversion"
  | "expired_or_revoked_policy_used_as_active"
  | "unattributed_interpretation"
  | "mutable_source_evidence";

export interface PolicyIdentity {
  readonly policyId: string;
  readonly name: string;
  readonly domain: string;
}

export interface PolicyVersion {
  readonly versionString: string;
  readonly releasedAt: string;
  readonly checksum: EvidenceChecksum;
}

export interface PolicyIssuer {
  readonly issuerId: string;
  readonly organization: string;
  readonly role: string;
}

export interface PolicySource {
  readonly uri: string;
  readonly format: "raw_text" | "json_schema" | "yaml_spec";
  readonly hash: EvidenceChecksum;
}

export interface PolicyStatement {
  readonly statementId: string;
  readonly rawText: string;
}

export interface PolicyRule {
  readonly ruleId: string;
  readonly statementId: string;
  readonly verb: string;
  readonly effect: "allow" | "deny" | "audit_required";
  readonly conditionId?: string;
}

export interface PolicyCondition {
  readonly conditionId: string;
  readonly field: string;
  readonly operator: "equals" | "in_range" | "matches";
  readonly value: string;
}

export interface PolicyScope {
  readonly allowedActors: readonly string[];
  readonly allowedResources: readonly string[];
  readonly validUntil?: string;
}

export interface PolicyEvidenceReference {
  readonly evidenceId: string;
  readonly checksum: EvidenceChecksum;
  readonly verifiedAt: string;
}

export interface PolicyEvaluationRecord {
  readonly evalId: string;
  readonly policyId: string;
  readonly version: string;
  readonly evaluatorId: string;
  readonly timestamp: string;
  readonly result: "compliant" | "non_compliant" | "inconclusive";
  readonly uncertaintyScore: number; // 0.0 to 1.0
}

export interface PolicyConflict {
  readonly conflictId: string;
  readonly policyIdA: string;
  readonly policyIdB: string;
  readonly description: string;
}

export interface PolicyLifecycleRecord {
  readonly recordId: string;
  readonly policyId: string;
  readonly state: PolicyLifecycleState;
  readonly updatedAt: string;
}

export interface PolicyFailureReport {
  readonly reportId: string;
  readonly failureClass: PolicyFailureClass;
  readonly policyId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Policy Evidence Engine.
 * Evaluates policy provenance, lifecycle integrity, and raw vs parsed statement matching.
 */
export class PolicyEvidenceEngine {
  private readonly policies = new Map<string, PolicyIdentity>();
  private readonly lifecycleStates = new Map<string, PolicyLifecycleRecord>();

  registerPolicy(
    identity: PolicyIdentity,
    lifecycle: PolicyLifecycleRecord
  ): PolicyFailureReport | undefined {
    // 1. Missing Provenance Check
    if (!identity.domain || identity.domain.trim() === "") {
      return {
        reportId: `fail_prov_${identity.policyId}`,
        failureClass: "missing_provenance",
        policyId: identity.policyId,
        description: `Policy '${identity.policyId}' lacks valid domain provenance attribution.`,
        timestamp: lifecycle.updatedAt
      };
    }

    // 2. Expired or Revoked Policy Used as Active Check
    if (lifecycle.state === "expired" || lifecycle.state === "revoked") {
      return {
        reportId: `fail_exp_${identity.policyId}`,
        failureClass: "expired_or_revoked_policy_used_as_active",
        policyId: identity.policyId,
        description: `Policy '${identity.policyId}' is in '${lifecycle.state}' state but registered as active.`,
        timestamp: lifecycle.updatedAt
      };
    }

    this.policies.set(identity.policyId, identity);
    this.lifecycleStates.set(identity.policyId, lifecycle);
    return undefined;
  }

  validateRuleParsing(
    statement: PolicyStatement,
    rule: PolicyRule,
    evaluatorId?: string
  ): PolicyFailureReport | undefined {
    // 3. Unattributed Interpretation Check
    if (!evaluatorId || evaluatorId.trim() === "") {
      return {
        reportId: `fail_unattr_${statement.statementId}`,
        failureClass: "unattributed_interpretation",
        policyId: statement.statementId,
        description: `Rule '${rule.ruleId}' derived from raw text without evaluator attribution.`,
        timestamp: new Date().toISOString()
      };
    }

    // 4. Silent Conversion Check
    if (statement.rawText.trim() === "" && rule.verb) {
      return {
        reportId: `fail_conv_${rule.ruleId}`,
        failureClass: "silent_natural_language_to_rule_conversion",
        policyId: statement.statementId,
        description: `Rule '${rule.ruleId}' created from empty natural language text.`,
        timestamp: new Date().toISOString()
      };
    }

    return undefined;
  }
}
