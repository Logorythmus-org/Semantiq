export type * from "./contracts.js";

import type {
  Community,
  CommunityAnalyticsSnapshot,
  CommunityContribution,
  CommunityEngineRepository,
  CommunityEngineService,
  CommunityMember,
  ConsensusRecord,
  ReputationRecord,
  TrustRecord
} from "./contracts.js";

const forbiddenReputationSources = new Set(["likes", "followers", "popularity", "virality"]);

export class LocalCommunityEngineRepository implements CommunityEngineRepository {
  private readonly communities = new Map<string, Community>();
  private readonly members = new Map<string, CommunityMember>();
  private readonly contributions: CommunityContribution[] = [];
  private readonly reputation: ReputationRecord[] = [];
  private readonly trust: TrustRecord[] = [];
  private readonly consensus: ConsensusRecord[] = [];

  async saveCommunity(community: Community): Promise<void> {
    this.communities.set(community.id, community);
  }

  async getCommunity(communityId: string): Promise<Community | undefined> {
    return this.communities.get(communityId);
  }

  async saveMember(member: CommunityMember): Promise<void> {
    this.members.set(member.id, member);
  }

  async getMember(memberId: string): Promise<CommunityMember | undefined> {
    return this.members.get(memberId);
  }

  async addContribution(contribution: CommunityContribution): Promise<void> {
    this.contributions.push(Object.freeze(contribution));
  }

  async listContributions(communityId: string): Promise<readonly CommunityContribution[]> {
    return this.contributions.filter((contribution) => contribution.communityId === communityId);
  }

  async addReputation(record: ReputationRecord): Promise<void> {
    this.reputation.push(Object.freeze(record));
  }

  async addTrust(record: TrustRecord): Promise<void> {
    this.trust.push(Object.freeze(record));
  }

  async addConsensus(record: ConsensusRecord): Promise<void> {
    this.consensus.push(Object.freeze(record));
  }

  listReputation(communityId: string, subjectId: string): readonly ReputationRecord[] {
    return this.reputation.filter(
      (record) => record.communityId === communityId && record.subjectId === subjectId
    );
  }

  listTrust(communityId: string, subjectId: string): readonly TrustRecord[] {
    return this.trust.filter(
      (record) => record.communityId === communityId && record.subjectId === subjectId
    );
  }
}

export class LocalCommunityEngineService implements CommunityEngineService {
  constructor(
    private readonly repository: LocalCommunityEngineRepository = new LocalCommunityEngineRepository()
  ) {}

  async createCommunity(community: Community): Promise<void> {
    if (community.questionIds.length === 0) {
      throw new Error("Communities must organize around at least one question");
    }
    await this.repository.saveCommunity(community);
  }

  async joinCommunity(member: CommunityMember): Promise<void> {
    await this.repository.saveMember(member);
  }

  async leaveCommunity(memberId: string): Promise<void> {
    const member = await this.repository.getMember(memberId);
    if (!member) {
      throw new Error(`Community member not found: ${memberId}`);
    }
  }

  async publishContribution(contribution: CommunityContribution): Promise<void> {
    await this.repository.addContribution(contribution);
  }

  async calculateReputation(
    communityId: string,
    subjectId: string
  ): Promise<readonly ReputationRecord[]> {
    const records = this.repository.listReputation(communityId, subjectId);
    for (const record of records) {
      if (forbiddenReputationSources.has(record.source)) {
        throw new Error(`Forbidden reputation source: ${record.source}`);
      }
    }
    return records;
  }

  async calculateTrust(communityId: string, subjectId: string): Promise<readonly TrustRecord[]> {
    return this.repository.listTrust(communityId, subjectId);
  }

  async generateAnalytics(communityId: string): Promise<CommunityAnalyticsSnapshot> {
    const community = await this.repository.getCommunity(communityId);
    if (!community) {
      throw new Error(`Community not found: ${communityId}`);
    }
    const contributions = await this.repository.listContributions(communityId);
    return {
      communityId,
      questionGrowth: community.questionIds.length,
      knowledgeGrowth: contributions.length,
      researchActivity: community.researchIds.length,
      contributionDiversity: new Set(contributions.map((contribution) => contribution.type)).size,
      collaboration: community.memberIds.length,
      innovation: 0,
      teaching: contributions.filter((contribution) => contribution.type === "teaching").length,
      learning: community.learningPathIds.length,
      communityHealth:
        community.memberIds.length && community.questionIds.length ? "healthy" : "unknown",
      researchVelocity: community.researchIds.length,
      evidenceDensity: contributions.filter((contribution) => contribution.type === "evidence")
        .length,
      semantiqEvolution: community.benchmarkHistoryIds.length
    };
  }
}
