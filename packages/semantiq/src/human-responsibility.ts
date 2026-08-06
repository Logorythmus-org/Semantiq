export interface ResponsibilityChainRecord {
  readonly deployingOrganization: string;
  readonly accountableHumanRole: string;
  readonly modelSelector: string;
  readonly configurationOwner: string;
  readonly dataOwner: string;
  readonly automationApprover: string;
  readonly humanReviewer: string;
  readonly appealOwner: string;
  readonly incidentOwner: string;
  readonly affectedPopulation: string;
  readonly decisionScope: string;
  readonly semantiqInfluenceLevel: 'none' | 'advisory' | 'prohibited_sole_decider';
  readonly influenceExplanation: string;
  readonly alternativeNonAutomatedPath: string;
  readonly expirationReviewDate: string;
}

export type HighImpactDomain =
  | 'employment'
  | 'housing'
  | 'education'
  | 'immigration'
  | 'criminal_justice'
  | 'medical_treatment'
  | 'credit_insurance_welfare'
  | 'legal_guilt'
  | 'voting_rights'
  | 'social_ranking';

export interface HighImpactUseDisclosure {
  readonly disclosureId: string;
  readonly domain: HighImpactDomain;
  readonly isSoleAutomatedDecider: boolean;
  readonly hasHumanAppealPath: boolean;
  readonly responsibilityRecord: ResponsibilityChainRecord;
}

export interface ResponsibilityValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Human Responsibility Validator Engine.
 * Enforces that SemantiQ scores never act as sole automated deciders in high-impact domains,
 * and ensures human accountability chains exist.
 */
export class HumanResponsibilityValidatorEngine {
  validateDisclosure(disclosure: HighImpactUseDisclosure): ResponsibilityValidationReport {
    const violations: string[] = [];

    if (disclosure.isSoleAutomatedDecider) {
      violations.push(
        `Sole automated decision-making in high-impact domain '${disclosure.domain}' is strictly prohibited.`
      );
    }

    if (!disclosure.hasHumanAppealPath) {
      violations.push('High-impact use must provide a human review and appeal path.');
    }

    const r = disclosure.responsibilityRecord;
    if (!r.accountableHumanRole || r.accountableHumanRole.trim() === '') {
      violations.push('Responsibility record must identify an accountable human role.');
    }

    if (!r.alternativeNonAutomatedPath || r.alternativeNonAutomatedPath.trim() === '') {
      violations.push('Responsibility record must specify an alternative non-automated path.');
    }

    if (r.accountableHumanRole.toLowerCase().includes('ai') || r.accountableHumanRole.toLowerCase().includes('benchmark')) {
      violations.push('Accountable role cannot be assigned to an AI model or benchmark.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  detectUnauthorizedEndorsement(statement: string): boolean {
    const lower = statement.toLowerCase();
    const forbidden = [
      'semantiq approved this decision',
      'semantiq certified this model',
      'semantiq requires this outcome',
      'semantiq guarantees safety'
    ];
    return forbidden.some(kw => lower.includes(kw));
  }
}
