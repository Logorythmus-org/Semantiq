export interface SemanticIdentityRef {
  readonly id: string;
  readonly displayName?: string;
}

export interface OwnershipClaim {
  readonly assetId: string;
  readonly owner: SemanticIdentityRef;
  readonly assertedAt: string;
}
