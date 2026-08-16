export interface ConstitutionalDecisionRecord {
  readonly decisionId: string;
  readonly title: string;
  readonly proposer: string;
  readonly date: string;
  readonly affectedScope: string;
  readonly evidence: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly conflictsOfInterest: readonly string[];
  readonly decision: string;
  readonly dissentingOpinions: readonly string[];
  readonly appealDeadline: string;
  readonly reviewDate: string;
  readonly supersededDecisions: readonly string[];
  readonly version: string;
}

export interface EmergencyPolicyRule {
  readonly ruleId: string;
  readonly description: string;
  readonly declaredAt: string;
  readonly expiresAt?: string | undefined;
  readonly isPermanent?: boolean | undefined;
}

export interface ConstitutionalInvariantReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

export class ConstitutionalValidatorEngine {
  validateEmergencyRule(rule: EmergencyPolicyRule): ConstitutionalInvariantReport {
    const violations: string[] = [];
    if (!rule.expiresAt || rule.isPermanent === true) {
      violations.push('Emergency authority must have an explicit expiration date and cannot be permanent.');
    }
    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateDecisionRecord(record: ConstitutionalDecisionRecord): ConstitutionalInvariantReport {
    const violations: string[] = [];

    if (!record.evidence || record.evidence.length === 0) {
      violations.push('Governance decision must contain supporting evidence.');
    }
    if (!record.appealDeadline || record.appealDeadline.trim() === '') {
      violations.push('Governance decision must specify an explicit appeal deadline.');
    }
    if (!record.reviewDate || record.reviewDate.trim() === '') {
      violations.push('Governance decision must specify a scheduled review date.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  attachDissent(
    existingRecord: ConstitutionalDecisionRecord,
    dissentingOpinion: string
  ): ConstitutionalDecisionRecord {
    if (!dissentingOpinion || dissentingOpinion.trim() === '') {
      throw new Error('Dissenting opinion cannot be empty.');
    }
    return {
      ...existingRecord,
      dissentingOpinions: [...existingRecord.dissentingOpinions, dissentingOpinion]
    };
  }

  supersedeDecision(
    previousRecord: ConstitutionalDecisionRecord,
    newDecisionId: string,
    newTitle: string,
    newDecision: string,
    newVersion: string
  ): ConstitutionalDecisionRecord {
    return {
      ...previousRecord,
      decisionId: newDecisionId,
      title: newTitle,
      decision: newDecision,
      version: newVersion,
      supersededDecisions: [...previousRecord.supersededDecisions, previousRecord.decisionId]
    };
  }
}
