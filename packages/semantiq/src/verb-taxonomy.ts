import fs from "node:fs";
import path from "node:path";

export type VerbFamily =
  | "generative"
  | "observational"
  | "cognitive"
  | "operational"
  | "communicative"
  | "coordinative"
  | "protective_and_recovery";

export type ReversibilityType = "reversible" | "irreversible" | "partially-reversible";
export type RiskClass = "none" | "low" | "medium" | "high" | "critical";

export interface VerbMetadata {
  readonly identifier: string;
  readonly name: string;
  readonly family: VerbFamily;
  readonly definition: string;
  readonly preconditions: readonly string[];
  readonly expectedInput: string;
  readonly expectedOutput: string;
  readonly affectedResourceTypes: readonly string[];
  readonly requiredPermissionClasses: readonly string[];
  readonly reversibility: ReversibilityType;
  readonly externalSideEffectPotential: RiskClass;
  readonly defaultRiskClass: RiskClass;
  readonly evidenceRequirements: readonly string[];
  readonly allowedAliases: readonly string[];
  readonly prohibitedAmbiguousAliases: readonly string[];
  readonly exampleEvents: readonly string[];
  readonly nonExamples: readonly string[];
}

export interface VerbTaxonomyData {
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly families: readonly VerbFamily[];
  readonly verbs: readonly VerbMetadata[];
}

export class VerbTaxonomyRegistry {
  private readonly verbsById = new Map<string, VerbMetadata>();
  private readonly aliasToIdMap = new Map<string, string>();

  constructor(taxonomyData?: VerbTaxonomyData) {
    const data = taxonomyData ?? this.loadDefaultTaxonomy();
    for (const verb of data.verbs) {
      if (this.verbsById.has(verb.identifier)) {
        throw new Error(`Duplicate verb identifier detected in taxonomy: ${verb.identifier}`);
      }
      this.verbsById.set(verb.identifier, verb);
      this.aliasToIdMap.set(verb.identifier.toLowerCase(), verb.identifier);

      for (const alias of verb.allowedAliases || []) {
        this.aliasToIdMap.set(alias.toLowerCase(), verb.identifier);
      }
    }
  }

  resolveVerb(verbNameOrAlias: string): VerbMetadata | undefined {
    const normalized = verbNameOrAlias.trim().toLowerCase();
    const id = this.aliasToIdMap.get(normalized);
    if (!id) return undefined;
    return this.verbsById.get(id);
  }

  getVerb(identifier: string): VerbMetadata {
    const verb = this.verbsById.get(identifier);
    if (!verb) {
      throw new Error(`Unknown canonical verb identifier: ${identifier}`);
    }
    return verb;
  }

  listVerbs(family?: VerbFamily): readonly VerbMetadata[] {
    const all = Array.from(this.verbsById.values());
    if (!family) return all;
    return all.filter((v) => v.family === family);
  }

  validateVerbEvent(
    verbName: string,
    evidenceProvided: readonly string[]
  ): { valid: boolean; reason?: string } {
    const verb = this.resolveVerb(verbName);
    if (!verb) {
      return { valid: false, reason: `Unknown or unmapped verb: ${verbName}` };
    }

    for (const req of verb.evidenceRequirements) {
      if (!evidenceProvided.includes(req)) {
        return {
          valid: false,
          reason: `Missing mandatory evidence requirement '${req}' for verb '${verb.identifier}'`
        };
      }
    }

    return { valid: true };
  }

  generateDocumentation(): string {
    let doc = `# Canonical Verb-Centered Behavioral Taxonomy\n\n`;
    for (const verb of this.verbsById.values()) {
      doc += `### Verb: \`${verb.identifier}\` (${verb.family})\n`;
      doc += `- **Definition**: ${verb.definition}\n`;
      doc += `- **Reversibility**: ${verb.reversibility}\n`;
      doc += `- **Default Risk**: ${verb.defaultRiskClass}\n`;
      doc += `- **Allowed Aliases**: ${verb.allowedAliases.join(", ") || "none"}\n\n`;
    }
    return doc;
  }

  private loadDefaultTaxonomy(): VerbTaxonomyData {
    const specPath = path.resolve(__dirname, "../../../products/semantiq/specs/verb-taxonomy.json");
    if (fs.existsSync(specPath)) {
      return JSON.parse(fs.readFileSync(specPath, "utf-8"));
    }
    throw new Error(`Taxonomy spec file not found at ${specPath}`);
  }
}
