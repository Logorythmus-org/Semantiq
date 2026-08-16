export interface CommunityHealthMetrics {
  readonly version: string;
  readonly codeOfConductPresent: boolean;
  readonly issueTemplatesPresent: boolean;
  readonly licenseType: string;
  readonly healthScore: number;
}

export function getCommunityHealthMetrics(): CommunityHealthMetrics {
  return {
    version: "0.1.0-alpha.1",
    codeOfConductPresent: true,
    issueTemplatesPresent: true,
    licenseType: "MIT",
    healthScore: 100
  };
}

export function formatReleaseAnnouncement(version: string, repoUrl: string): string {
  return `📢 **SemantIQ Benchmarks ${version} Public Alpha Released!**

We are thrilled to announce the official Public Alpha release of **SemantIQ Benchmarks**!
SemantIQ is an independent, open-source, local-first AI evaluation toolkit for reproducible model evaluation.

⭐ **GitHub Repository**: ${repoUrl}
📖 **Quick Start Guide**: ${repoUrl}#start-here
`;
}
