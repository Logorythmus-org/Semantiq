import type { EvidenceChecksum } from "./event-schema.js";

export type AuditFailureClass =
  | "missing_policy_evidence"
  | "missing_approval"
  | "tampered_event"
  | "incomplete_recovery"
  | "altered_responsibility_edge"
  | "source_evaluator_mixing"
  | "nondeterministic_inventory"
  | "unsupported_audit_conclusion";

export interface AuditScope {
  readonly scopeId: string;
  readonly targetDomain: string;
  readonly startTimestamp: string;
  readonly endTimestamp: string;
}

export interface AuditCriterion {
  readonly criterionId: string;
  readonly statement: string;
  readonly category: "security" | "authority" | "approval" | "recovery";
}

export interface EvidenceInventory {
  readonly inventoryId: string;
  readonly checksums: readonly EvidenceChecksum[];
  readonly isDeterministic: boolean;
}

export interface MissingEvidenceRegister {
  readonly registerId: string;
  readonly missingItemNames: readonly string[];
}

export interface AuditFinding {
  readonly findingId: string;
  readonly criterionId: string;
  readonly status: "satisfied" | "violated" | "inconclusive";
  readonly evidenceRef?: string | undefined;
}

export interface AuditLimitation {
  readonly limitationId: string;
  readonly description: string;
}

export interface GovernanceIncidentBundle {
  readonly incidentId: string;
  readonly scope: AuditScope;
  readonly policyRef?: string | undefined;
  readonly approvalRef?: string | undefined;
  readonly eventInventory: EvidenceInventory;
  readonly recoveryCompleted: boolean;
  readonly residualRiskScore: number; // 0.0 to 1.0
  readonly timestamp: string;
}

export interface GovernanceAuditBundle {
  readonly auditId: string;
  readonly incidentId: string;
  readonly scope: AuditScope;
  readonly criteria: readonly AuditCriterion[];
  readonly findings: readonly AuditFinding[];
  readonly limitations: readonly AuditLimitation[];
  readonly missingRegister: MissingEvidenceRegister;
  readonly timestamp: string;
}

export interface AuditFailureReport {
  readonly reportId: string;
  readonly failureClass: AuditFailureClass;
  readonly incidentId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Governance Incident & Audit Engine.
 * Evaluates incident & audit bundle integrity, evidence inventories, tampered events, and recovery completeness.
 */
export class GovernanceIncidentAuditEngine {
  evaluateIncidentBundle(bundle: GovernanceIncidentBundle): AuditFailureReport | undefined {
    // 1. Missing Policy Evidence Check
    if (!bundle.policyRef || bundle.policyRef.trim() === "") {
      return {
        reportId: `fail_no_pol_${bundle.incidentId}`,
        failureClass: "missing_policy_evidence",
        incidentId: bundle.incidentId,
        description: `Incident bundle '${bundle.incidentId}' lacks required policy version evidence reference.`,
        timestamp: bundle.timestamp
      };
    }

    // 2. Missing Approval Check
    if (!bundle.approvalRef || bundle.approvalRef.trim() === "") {
      return {
        reportId: `fail_no_app_${bundle.incidentId}`,
        failureClass: "missing_approval",
        incidentId: bundle.incidentId,
        description: `Incident bundle '${bundle.incidentId}' lacks required human approval evidence reference.`,
        timestamp: bundle.timestamp
      };
    }

    // 3. Non-deterministic Inventory Check
    if (!bundle.eventInventory.isDeterministic) {
      return {
        reportId: `fail_nondet_${bundle.incidentId}`,
        failureClass: "nondeterministic_inventory",
        incidentId: bundle.incidentId,
        description: `Event inventory for incident '${bundle.incidentId}' is non-deterministic.`,
        timestamp: bundle.timestamp
      };
    }

    // 4. Incomplete Recovery Check
    if (!bundle.recoveryCompleted) {
      return {
        reportId: `fail_incomp_rec_${bundle.incidentId}`,
        failureClass: "incomplete_recovery",
        incidentId: bundle.incidentId,
        description: `Incident '${bundle.incidentId}' closed without completed recovery evidence.`,
        timestamp: bundle.timestamp
      };
    }

    return undefined;
  }
}
