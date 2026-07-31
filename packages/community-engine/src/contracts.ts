export type CommunityLifecycleState =
  | "idea"
  | "formation"
  | "growth"
  | "research"
  | "knowledge-production"
  | "innovation"
  | "publication"
  | "evolution"
  | "archive";

export type CommunityType =
  | "open"
  | "private"
  | "invite-only"
  | "scientific"
  | "educational"
  | "business"
  | "citizen-science"
  | "hackathon"
  | "innovation"
  | "gaming"
  | "local"
  | "global"
  | "temporary"
  | "persistent";

export type CommunityRoleName =
  | "founder"
  | "moderator"
  | "researcher"
  | "teacher"
  | "student"
  | "engineer"
  | "scientist"
  | "reviewer"
  | "curator"
  | "mentor"
  | "community-builder"
  | "observer"
  | "ai-agent"
  | "administrator";

export type CommunityContributionType =
  | "question"
  | "evidence"
  | "experiment"
  | "project"
  | "review"
  | "code"
  | "dataset"
  | "game"
  | "narrative"
  | "publication"
  | "mentoring"
  | "teaching"
  | "moderation"
  | "translation"
  | "visualization";

export interface Community {
  readonly id: string;
  readonly type: CommunityType;
  readonly state: CommunityLifecycleState;
  readonly mission: string;
  readonly purpose: string;
  readonly description: string;
  readonly questionIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly graphId?: string;
  readonly memberIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly rules: readonly string[];
  readonly moderationPolicyIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
  readonly achievementIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly gameIds: readonly string[];
  readonly learningPathIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly publicationIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly futureGoals: readonly string[];
}

export interface CommunityMember {
  readonly id: string;
  readonly communityId: string;
  readonly identityId: string;
  readonly roleIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly expertise: readonly string[];
  readonly interests: readonly string[];
  readonly trustRecordIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly learningProgressIds: readonly string[];
  readonly researchActivityIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly achievementIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
  readonly reputationRecordIds: readonly string[];
}

export interface CommunityRole {
  readonly id: string;
  readonly communityId: string;
  readonly name: CommunityRoleName;
  readonly capabilityIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly composable: true;
}

export interface CommunityContribution {
  readonly id: string;
  readonly communityId: string;
  readonly type: CommunityContributionType;
  readonly authorId: string;
  readonly timestamp: string;
  readonly confidence: number;
  readonly semantiqScore?: number;
  readonly relationIds: readonly string[];
  readonly impact: string;
  readonly license: string;
  readonly version: string;
}

export interface ReputationRecord {
  readonly id: string;
  readonly communityId: string;
  readonly subjectId: string;
  readonly source:
    | "question-quality"
    | "evidence-quality"
    | "scientific-thinking"
    | "teaching"
    | "collaboration"
    | "review-quality"
    | "project-contribution"
    | "innovation"
    | "community-support"
    | "mentoring"
    | "research-integrity";
  readonly contributionId: string;
  readonly score: number;
  readonly explanation: string;
  readonly confidence: number;
}

export interface TrustRecord {
  readonly id: string;
  readonly communityId: string;
  readonly subjectId: string;
  readonly signal:
    | "verified-identity"
    | "verified-expertise"
    | "verified-contribution"
    | "verified-research"
    | "verified-review"
    | "verified-publication"
    | "verified-organization"
    | "verified-project"
    | "verified-teaching";
  readonly evidenceIds: readonly string[];
  readonly verifiedBy: string;
  readonly explanation: string;
  readonly createdAt: string;
}

export interface ConsensusRecord {
  readonly id: string;
  readonly communityId: string;
  readonly questionId: string;
  readonly status:
    | "agreement"
    | "disagreement"
    | "competing-hypotheses"
    | "evidence-comparison"
    | "open-debate"
    | "minority-report";
  readonly evidenceIds: readonly string[];
  readonly confidence: number;
  readonly alternativeInterpretations: readonly string[];
  readonly decisionHistoryIds: readonly string[];
  readonly explanation: string;
}

export interface CollectiveIntelligenceSnapshot {
  readonly communityId: string;
  readonly sharedQuestionIds: readonly string[];
  readonly mappingActivity: number;
  readonly distributedResearch: number;
  readonly collectiveEvidence: number;
  readonly collaborativeBenchmarking: number;
  readonly openDebates: number;
  readonly minorityReports: number;
}

export interface CommunityAnalyticsSnapshot {
  readonly communityId: string;
  readonly questionGrowth: number;
  readonly knowledgeGrowth: number;
  readonly researchActivity: number;
  readonly contributionDiversity: number;
  readonly collaboration: number;
  readonly innovation: number;
  readonly teaching: number;
  readonly learning: number;
  readonly communityHealth: "healthy" | "at-risk" | "stalled" | "unknown";
  readonly researchVelocity: number;
  readonly evidenceDensity: number;
  readonly semantiqEvolution: number;
}

export interface CommunityAgentRole {
  readonly role:
    | "community-facilitator"
    | "research-coordinator"
    | "knowledge-curator"
    | "mentor"
    | "conflict-resolution"
    | "reviewer"
    | "education"
    | "recommendation"
    | "analytics"
    | "community-health";
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly evaluation: readonly string[];
  readonly failureModes: readonly string[];
  readonly humanOversight: string;
}

export interface CommunityEngineRepository {
  saveCommunity(community: Community): Promise<void>;
  getCommunity(communityId: string): Promise<Community | undefined>;
  saveMember(member: CommunityMember): Promise<void>;
  getMember(memberId: string): Promise<CommunityMember | undefined>;
  addContribution(contribution: CommunityContribution): Promise<void>;
  listContributions(communityId: string): Promise<readonly CommunityContribution[]>;
  addReputation(record: ReputationRecord): Promise<void>;
  addTrust(record: TrustRecord): Promise<void>;
  addConsensus(record: ConsensusRecord): Promise<void>;
}

export interface CommunityEngineService {
  createCommunity(community: Community): Promise<void>;
  joinCommunity(member: CommunityMember): Promise<void>;
  leaveCommunity(memberId: string): Promise<void>;
  publishContribution(contribution: CommunityContribution): Promise<void>;
  calculateReputation(communityId: string, subjectId: string): Promise<readonly ReputationRecord[]>;
  calculateTrust(communityId: string, subjectId: string): Promise<readonly TrustRecord[]>;
  generateAnalytics(communityId: string): Promise<CommunityAnalyticsSnapshot>;
}

export interface CommunityEngineEvent {
  readonly type:
    | "CommunityCreated"
    | "MemberJoined"
    | "RoleAssigned"
    | "ContributionAdded"
    | "ResearchStarted"
    | "ConsensusReached"
    | "KnowledgeExpanded"
    | "PublicationReleased"
    | "InnovationCreated"
    | "CommunityBenchmarked"
    | "MentorshipCompleted"
    | "CommunityArchived";
  readonly version: number;
  readonly occurredAt: string;
  readonly communityId?: string;
  readonly payload: unknown;
}
