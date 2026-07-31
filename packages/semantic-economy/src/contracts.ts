export type SemanticAssetType =
  | "question-pack"
  | "research-report"
  | "dataset"
  | "workflow-template"
  | "ai-agent"
  | "prompt-pack"
  | "educational-game"
  | "knowledge-card-deck"
  | "narrative-book"
  | "scientific-atlas-entry"
  | "experiment-protocol"
  | "repository-template"
  | "presentation"
  | "course"
  | "community-toolkit"
  | "benchmark-profile";

export type AssetAccessModel =
  | "free"
  | "paid"
  | "open-source"
  | "public-good"
  | "community"
  | "institutional"
  | "private-sharing"
  | "subscription"
  | "one-time-purchase"
  | "donation"
  | "sponsorship"
  | "funding-campaign";

export type LicenseFamily =
  | "open"
  | "creative-commons"
  | "commercial"
  | "research"
  | "educational"
  | "community"
  | "custom"
  | "attribution-required"
  | "share-alike"
  | "no-derivatives"
  | "internal-use"
  | "public-domain";

export type OwnershipModel = "single" | "shared" | "community" | "organization";

export type EconomyTransactionType =
  | "free-claim"
  | "purchase"
  | "donation"
  | "sponsorship"
  | "license-grant"
  | "revenue-split"
  | "refund"
  | "transfer"
  | "subscription"
  | "access-expiry";

export type FundingType =
  | "project"
  | "research"
  | "community"
  | "educational"
  | "innovation"
  | "open-science-grant"
  | "challenge-bounty"
  | "question-bounty"
  | "public-goods";

export interface SemanticAsset {
  readonly id: string;
  readonly type: SemanticAssetType;
  readonly title: string;
  readonly description: string;
  readonly creatorId: string;
  readonly contributorIds: readonly string[];
  readonly sourceQuestionIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly knowledgeGraphLinkIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly licenseId: string;
  readonly ownershipId: string;
  readonly version: string;
  readonly dependencyIds: readonly string[];
  readonly usageRights: readonly string[];
  readonly price: number;
  readonly currency: string;
  readonly accessModel: AssetAccessModel;
  readonly reputationRecordIds: readonly string[];
  readonly trustRecordIds: readonly string[];
  readonly auditHistoryIds: readonly string[];
  readonly publicGood: boolean;
  readonly commercial: boolean;
}

export interface MarketplaceListing {
  readonly id: string;
  readonly assetId: string;
  readonly published: boolean;
  readonly title: string;
  readonly accessModel: AssetAccessModel;
  readonly licenseId: string;
  readonly price: number;
  readonly currency: string;
  readonly semantiqScoreIds: readonly string[];
  readonly trustRecordIds: readonly string[];
  readonly reviewIds: readonly string[];
  readonly educationalValue: number;
  readonly researchValue: number;
  readonly safetyReviewIds: readonly string[];
  readonly humanApprovalId?: string;
}

export interface MachineReadableLicense {
  readonly id: string;
  readonly family: LicenseFamily;
  readonly assetId: string;
  readonly grantorId: string;
  readonly granteeId?: string;
  readonly attributionRequired: boolean;
  readonly shareAlike: boolean;
  readonly derivativesAllowed: boolean;
  readonly commercialUseAllowed: boolean;
  readonly internalUseOnly: boolean;
  readonly publicDomain: boolean;
  readonly expiry?: string;
  readonly terms: readonly string[];
  readonly auditId: string;
}

export interface OwnershipRecord {
  readonly id: string;
  readonly assetId: string;
  readonly model: OwnershipModel;
  readonly ownerIds: readonly string[];
  readonly contributionProofIds: readonly string[];
  readonly organizationId?: string;
  readonly communityId?: string;
  readonly transparent: true;
  readonly auditId: string;
}

export interface RevenueShare {
  readonly id: string;
  readonly assetId: string;
  readonly recipientId: string;
  readonly percentage: number;
  readonly basis: "ownership" | "contribution" | "donation-routing" | "funding-pool" | "public-benefit";
  readonly contributionProofIds: readonly string[];
}

export interface EconomyTransaction {
  readonly id: string;
  readonly type: EconomyTransactionType;
  readonly assetId?: string;
  readonly campaignId?: string;
  readonly fromId?: string;
  readonly toId: string;
  readonly amount: number;
  readonly currency: string;
  readonly licenseId?: string;
  readonly revenueShareIds: readonly string[];
  readonly walletRecordIds: readonly string[];
  readonly status: "created" | "pending" | "completed" | "failed" | "refunded" | "expired";
  readonly auditHistoryIds: readonly string[];
}

export interface FundingCampaign {
  readonly id: string;
  readonly type: FundingType;
  readonly title: string;
  readonly purpose: string;
  readonly assetId?: string;
  readonly projectId?: string;
  readonly beneficiaryId: string;
  readonly goalAmount: number;
  readonly raisedAmount: number;
  readonly currency: string;
  readonly contributorTransactionIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly publicGood: boolean;
  readonly paywallRequired: false;
  readonly auditHistoryIds: readonly string[];
}

export interface AssetReview {
  readonly id: string;
  readonly assetId: string;
  readonly reviewerId: string;
  readonly semantiqScoreIds: readonly string[];
  readonly evidenceQuality: number;
  readonly licenseClarity: number;
  readonly safety: number;
  readonly educationalValue: number;
  readonly researchValue: number;
  readonly trustRecordIds: readonly string[];
  readonly explanation: string;
  readonly approved: boolean;
}

export interface MarketplaceSearchQuery {
  readonly text: string;
  readonly assetTypes: readonly SemanticAssetType[];
  readonly sourceQuestionIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly licenseFamilies: readonly LicenseFamily[];
  readonly creatorIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly educational: boolean;
  readonly research: boolean;
  readonly trustRequired: boolean;
  readonly limit: number;
}

export interface MarketplaceAgentRole {
  readonly role:
    | "asset-curator"
    | "license-assistant"
    | "pricing-assistant"
    | "quality-reviewer"
    | "trust-reviewer"
    | "funding-agent"
    | "recommendation-agent"
    | "marketplace-moderator"
    | "attribution-agent";
  readonly capabilities: readonly string[];
  readonly explanationRequired: true;
  readonly humanApprovalRequired: boolean;
}

export interface SemanticEconomyRepository {
  saveAsset(asset: SemanticAsset): Promise<void>;
  getAsset(assetId: string): Promise<SemanticAsset | undefined>;
  listAssets(): Promise<readonly SemanticAsset[]>;
  saveListing(listing: MarketplaceListing): Promise<void>;
  getListing(assetId: string): Promise<MarketplaceListing | undefined>;
  saveLicense(license: MachineReadableLicense): Promise<void>;
  getLicense(licenseId: string): Promise<MachineReadableLicense | undefined>;
  saveOwnership(record: OwnershipRecord): Promise<void>;
  getOwnership(ownershipId: string): Promise<OwnershipRecord | undefined>;
  saveTransaction(transaction: EconomyTransaction): Promise<void>;
  saveCampaign(campaign: FundingCampaign): Promise<void>;
  getCampaign(campaignId: string): Promise<FundingCampaign | undefined>;
  saveReview(review: AssetReview): Promise<void>;
  listReviews(assetId: string): Promise<readonly AssetReview[]>;
  publishEvent(event: SemanticEconomyEvent): Promise<void>;
}

export interface SemanticEconomyService {
  createAsset(asset: SemanticAsset): Promise<void>;
  publishAsset(listing: MarketplaceListing): Promise<void>;
  licenseAsset(assetId: string, license: MachineReadableLicense): Promise<void>;
  purchaseAsset(assetId: string, buyerId: string): Promise<EconomyTransaction>;
  claimAsset(assetId: string, claimantId: string): Promise<EconomyTransaction>;
  fundProject(campaign: FundingCampaign): Promise<void>;
  donate(campaignId: string, donorId: string, amount: number): Promise<EconomyTransaction>;
  calculateRoyalties(assetId: string, amount: number): Promise<readonly RevenueShare[]>;
  reviewAsset(review: AssetReview): Promise<void>;
  searchAssets(query: MarketplaceSearchQuery): Promise<readonly SemanticAsset[]>;
  recommendAssets(query: MarketplaceSearchQuery): Promise<readonly SemanticAsset[]>;
  exportAsset(assetId: string): Promise<string>;
}

export interface SemanticEconomyEvent {
  readonly type:
    | "AssetCreated"
    | "AssetPublished"
    | "LicenseGranted"
    | "AssetPurchased"
    | "DonationReceived"
    | "FundingStarted"
    | "FundingCompleted"
    | "RoyaltyCalculated"
    | "AssetReviewed"
    | "AssetUpdated"
    | "RevenueDistributed";
  readonly version: number;
  readonly occurredAt: string;
  readonly assetId?: string;
  readonly transactionId?: string;
  readonly campaignId?: string;
  readonly payload: unknown;
}
