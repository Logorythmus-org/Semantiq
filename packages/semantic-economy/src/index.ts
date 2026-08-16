export type * from "./contracts.js";

import type {
  AssetReview,
  EconomyTransaction,
  FundingCampaign,
  MachineReadableLicense,
  MarketplaceListing,
  MarketplaceSearchQuery,
  OwnershipRecord,
  RevenueShare,
  SemanticAsset,
  SemanticEconomyEvent,
  SemanticEconomyRepository,
  SemanticEconomyService
} from "./contracts.js";

export class LocalSemanticEconomyRepository implements SemanticEconomyRepository {
  private readonly assets = new Map<string, SemanticAsset>();
  private readonly listings = new Map<string, MarketplaceListing>();
  private readonly licenses = new Map<string, MachineReadableLicense>();
  private readonly ownership = new Map<string, OwnershipRecord>();
  private readonly transactions: EconomyTransaction[] = [];
  private readonly campaigns = new Map<string, FundingCampaign>();
  private readonly reviews: AssetReview[] = [];
  private readonly events: SemanticEconomyEvent[] = [];

  async saveAsset(asset: SemanticAsset): Promise<void> {
    this.assets.set(asset.id, asset);
  }

  async getAsset(assetId: string): Promise<SemanticAsset | undefined> {
    return this.assets.get(assetId);
  }

  async listAssets(): Promise<readonly SemanticAsset[]> {
    return [...this.assets.values()];
  }

  async saveListing(listing: MarketplaceListing): Promise<void> {
    this.listings.set(listing.assetId, listing);
  }

  async getListing(assetId: string): Promise<MarketplaceListing | undefined> {
    return this.listings.get(assetId);
  }

  async saveLicense(license: MachineReadableLicense): Promise<void> {
    this.licenses.set(license.id, license);
  }

  async getLicense(licenseId: string): Promise<MachineReadableLicense | undefined> {
    return this.licenses.get(licenseId);
  }

  async saveOwnership(record: OwnershipRecord): Promise<void> {
    this.ownership.set(record.id, record);
  }

  async getOwnership(ownershipId: string): Promise<OwnershipRecord | undefined> {
    return this.ownership.get(ownershipId);
  }

  async saveTransaction(transaction: EconomyTransaction): Promise<void> {
    this.transactions.push(Object.freeze(transaction));
  }

  async saveCampaign(campaign: FundingCampaign): Promise<void> {
    this.campaigns.set(campaign.id, campaign);
  }

  async getCampaign(campaignId: string): Promise<FundingCampaign | undefined> {
    return this.campaigns.get(campaignId);
  }

  async saveReview(review: AssetReview): Promise<void> {
    this.reviews.push(Object.freeze(review));
  }

  async listReviews(assetId: string): Promise<readonly AssetReview[]> {
    return this.reviews.filter((review) => review.assetId === assetId);
  }

  async publishEvent(event: SemanticEconomyEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly SemanticEconomyEvent[] {
    return this.events;
  }
}

export class LocalSemanticEconomyService implements SemanticEconomyService {
  constructor(private readonly repository: LocalSemanticEconomyRepository = new LocalSemanticEconomyRepository()) {}

  async createAsset(asset: SemanticAsset): Promise<void> {
    if (asset.sourceQuestionIds.length === 0) {
      throw new Error("Semantic assets must reference at least one source question");
    }
    await this.repository.saveAsset(asset);
    await this.emit("AssetCreated", { type: asset.type, publicGood: asset.publicGood }, asset.id);
  }

  async publishAsset(listing: MarketplaceListing): Promise<void> {
    const asset = await this.requireAsset(listing.assetId);
    if (asset.commercial && !listing.humanApprovalId) {
      throw new Error(`Commercial publishing requires human approval: ${asset.id}`);
    }
    await this.repository.saveListing(listing);
    await this.emit("AssetPublished", { listingId: listing.id, accessModel: listing.accessModel }, asset.id);
  }

  async licenseAsset(assetId: string, license: MachineReadableLicense): Promise<void> {
    await this.requireAsset(assetId);
    if (license.assetId !== assetId) {
      throw new Error(`License asset mismatch: ${license.id}`);
    }
    await this.repository.saveLicense(license);
    await this.emit("LicenseGranted", { licenseId: license.id, family: license.family }, assetId);
  }

  async purchaseAsset(assetId: string, buyerId: string): Promise<EconomyTransaction> {
    const asset = await this.requireAsset(assetId);
    if (asset.price <= 0) {
      throw new Error(`Asset is not priced for purchase: ${asset.id}`);
    }
    return this.createTransaction("purchase", asset, buyerId, asset.price);
  }

  async claimAsset(assetId: string, claimantId: string): Promise<EconomyTransaction> {
    const asset = await this.requireAsset(assetId);
    if (asset.price > 0 && asset.accessModel !== "public-good") {
      throw new Error(`Paid assets cannot be free-claimed: ${asset.id}`);
    }
    return this.createTransaction("free-claim", asset, claimantId, 0);
  }

  async fundProject(campaign: FundingCampaign): Promise<void> {
    if (campaign.publicGood && campaign.paywallRequired !== false) {
      throw new Error("Public-good funding cannot require paywalls");
    }
    await this.repository.saveCampaign(campaign);
    await this.emit("FundingStarted", { type: campaign.type, goalAmount: campaign.goalAmount }, campaign.assetId, undefined, campaign.id);
  }

  async donate(campaignId: string, donorId: string, amount: number): Promise<EconomyTransaction> {
    const campaign = await this.repository.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Funding campaign not found: ${campaignId}`);
    }
    const transaction: EconomyTransaction = {
      id: `${campaignId}:donation:${Date.now()}`,
      type: "donation",
      campaignId,
      fromId: donorId,
      toId: campaign.beneficiaryId,
      amount,
      currency: campaign.currency,
      revenueShareIds: [],
      walletRecordIds: [],
      status: "completed",
      auditHistoryIds: campaign.auditHistoryIds
    };
    await this.repository.saveTransaction(transaction);
    await this.emit("DonationReceived", { amount, donorId }, campaign.assetId, transaction.id, campaign.id);
    if (campaign.raisedAmount + amount >= campaign.goalAmount) {
      await this.emit("FundingCompleted", { campaignId }, campaign.assetId, transaction.id, campaign.id);
    }
    return transaction;
  }

  async calculateRoyalties(assetId: string, amount: number): Promise<readonly RevenueShare[]> {
    const asset = await this.requireAsset(assetId);
    const ownership = await this.repository.getOwnership(asset.ownershipId);
    if (!ownership) {
      throw new Error(`Ownership record not found: ${asset.ownershipId}`);
    }
    const split = ownership.ownerIds.length === 0 ? 0 : 100 / ownership.ownerIds.length;
    const shares = ownership.ownerIds.map<RevenueShare>((ownerId) => ({
      id: `${asset.id}:royalty:${ownerId}`,
      assetId: asset.id,
      recipientId: ownerId,
      percentage: split,
      basis: "ownership",
      contributionProofIds: ownership.contributionProofIds
    }));
    await this.emit("RoyaltyCalculated", { amount, shares }, asset.id);
    return shares;
  }

  async reviewAsset(review: AssetReview): Promise<void> {
    await this.requireAsset(review.assetId);
    await this.repository.saveReview(review);
    await this.emit("AssetReviewed", { reviewId: review.id, approved: review.approved }, review.assetId);
  }

  async searchAssets(query: MarketplaceSearchQuery): Promise<readonly SemanticAsset[]> {
    const text = query.text.toLowerCase();
    const assets = await this.repository.listAssets();
    return assets
      .filter((asset) => query.assetTypes.length === 0 || query.assetTypes.includes(asset.type))
      .filter((asset) => text.length === 0 || asset.title.toLowerCase().includes(text) || asset.description.toLowerCase().includes(text))
      .filter((asset) => query.sourceQuestionIds.length === 0 || asset.sourceQuestionIds.some((id) => query.sourceQuestionIds.includes(id)))
      .filter((asset) => query.projectIds.length === 0 || asset.projectIds.some((id) => query.projectIds.includes(id)))
      .filter((asset) => query.creatorIds.length === 0 || query.creatorIds.includes(asset.creatorId))
      .filter((asset) => !query.trustRequired || asset.trustRecordIds.length > 0)
      .slice(0, query.limit);
  }

  async recommendAssets(query: MarketplaceSearchQuery): Promise<readonly SemanticAsset[]> {
    const assets = await this.searchAssets(query);
    return [...assets].sort((left, right) => scoreAsset(right) - scoreAsset(left));
  }

  async exportAsset(assetId: string): Promise<string> {
    const asset = await this.requireAsset(assetId);
    const listing = await this.repository.getListing(assetId);
    const reviews = await this.repository.listReviews(assetId);
    return JSON.stringify({ asset, listing, reviews }, null, 2);
  }

  private async createTransaction(
    type: "purchase" | "free-claim",
    asset: SemanticAsset,
    actorId: string,
    amount: number
  ): Promise<EconomyTransaction> {
    const transaction: EconomyTransaction = {
      id: `${asset.id}:${type}:${Date.now()}`,
      type,
      assetId: asset.id,
      fromId: actorId,
      toId: asset.creatorId,
      amount,
      currency: asset.currency,
      licenseId: asset.licenseId,
      revenueShareIds: [],
      walletRecordIds: [],
      status: "completed",
      auditHistoryIds: asset.auditHistoryIds
    };
    await this.repository.saveTransaction(transaction);
    await this.emit(type === "purchase" ? "AssetPurchased" : "LicenseGranted", { amount, actorId }, asset.id, transaction.id);
    return transaction;
  }

  private async requireAsset(assetId: string): Promise<SemanticAsset> {
    const asset = await this.repository.getAsset(assetId);
    if (!asset) {
      throw new Error(`Semantic asset not found: ${assetId}`);
    }
    return asset;
  }

  private async emit(
    type: SemanticEconomyEvent["type"],
    payload: unknown,
    assetId?: string,
    transactionId?: string,
    campaignId?: string
  ): Promise<void> {
    const event: SemanticEconomyEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withAsset = assetId ? { ...event, assetId } : event;
    const withTransaction = transactionId ? { ...withAsset, transactionId } : withAsset;
    const withCampaign = campaignId ? { ...withTransaction, campaignId } : withTransaction;
    await this.repository.publishEvent(withCampaign);
  }
}

function scoreAsset(asset: SemanticAsset): number {
  return asset.semantiqScoreIds.length + asset.trustRecordIds.length + asset.reputationRecordIds.length;
}
