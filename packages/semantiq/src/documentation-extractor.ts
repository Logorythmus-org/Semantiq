export type DocSection =
  | 'readme'
  | 'quickstart'
  | 'installation'
  | 'architecture'
  | 'cli'
  | 'configuration'
  | 'offline'
  | 'adapters'
  | 'benchmarks'
  | 'single-agent'
  | 'multi-agent'
  | 'governance-evidence'
  | 'replay'
  | 'scenarios'
  | 'contribution'
  | 'security'
  | 'privacy'
  | 'limitations'
  | 'roadmap'
  | 'changelog'
  | 'citation';

export type ForbiddenDocTopic =
  | 'tech-club-identity'
  | 'workspace-os'
  | 'civilization-os'
  | 'wallet'
  | 'marketplace'
  | 'parent-architecture'
  | 'internal-research'
  | 'private-plans'
  | 'obsolete-publication-reports'
  | 'premature-release-claims';

export interface DocExtractionResult {
  readonly section: DocSection;
  readonly isIncluded: boolean;
  readonly hasForbiddenContent: boolean;
  readonly claimsAreVerifiable: boolean;
}

export interface DocTruthAuditReport {
  readonly totalSections: number;
  readonly passedSections: number;
  readonly forbiddenTopicsFound: readonly ForbiddenDocTopic[];
  readonly isClean: boolean;
  readonly timestamp: string;
}

const REQUIRED_SECTIONS: DocSection[] = [
  'readme', 'quickstart', 'installation', 'architecture', 'cli',
  'configuration', 'offline', 'adapters', 'benchmarks', 'single-agent',
  'multi-agent', 'governance-evidence', 'replay', 'scenarios',
  'contribution', 'security', 'privacy', 'limitations', 'roadmap',
  'changelog', 'citation'
];

const FORBIDDEN_KEYWORDS: Record<ForbiddenDocTopic, string[]> = {
  'tech-club-identity': ['Tech Club organization', 'Tech Club member'],
  'workspace-os': ['Workspace OS', 'WorkspaceOS'],
  'civilization-os': ['Civilization OS', 'CivilizationOS'],
  'wallet': ['wallet integration', 'crypto wallet'],
  'marketplace': ['marketplace listing', 'marketplace integration'],
  'parent-architecture': ['monorepo architecture', 'parent workspace'],
  'internal-research': ['internal research report', 'private research'],
  'private-plans': ['private roadmap', 'internal plan'],
  'obsolete-publication-reports': ['Phase 7 publication freeze', 'publication freeze report'],
  'premature-release-claims': ['Phase 12 published', 'now available on npm', 'released to public']
};

/**
 * Documentation Extractor Engine.
 * Validates that all required SemantIQ doc sections exist, contain no forbidden parent content,
 * and all claims are verifiable.
 */
export class DocumentationExtractorEngine {
  getRequiredSections(): readonly DocSection[] {
    return REQUIRED_SECTIONS;
  }

  auditDocContent(content: string): readonly ForbiddenDocTopic[] {
    const found: ForbiddenDocTopic[] = [];
    for (const [topic, keywords] of Object.entries(FORBIDDEN_KEYWORDS) as [ForbiddenDocTopic, string[]][]) {
      if (keywords.some(kw => content.toLowerCase().includes(kw.toLowerCase()))) {
        found.push(topic);
      }
    }
    return found;
  }

  validateSection(section: DocSection, content: string): DocExtractionResult {
    const forbidden = this.auditDocContent(content);
    const hasForbiddenContent = forbidden.length > 0;
    const claimsAreVerifiable = !content.includes('[TODO]') && !content.includes('[PLACEHOLDER]');

    return {
      section,
      isIncluded: content.trim().length > 0,
      hasForbiddenContent,
      claimsAreVerifiable
    };
  }

  runTruthAudit(sections: readonly { section: DocSection; content: string }[]): DocTruthAuditReport {
    let passedSections = 0;
    const allForbidden = new Set<ForbiddenDocTopic>();

    for (const { section, content } of sections) {
      const result = this.validateSection(section, content);
      if (result.isIncluded && !result.hasForbiddenContent && result.claimsAreVerifiable) {
        passedSections++;
      }
      const forbidden = this.auditDocContent(content);
      forbidden.forEach(f => allForbidden.add(f));
    }

    return {
      totalSections: sections.length,
      passedSections,
      forbiddenTopicsFound: Array.from(allForbidden),
      isClean: allForbidden.size === 0 && passedSections === sections.length,
      timestamp: new Date().toISOString()
    };
  }
}
