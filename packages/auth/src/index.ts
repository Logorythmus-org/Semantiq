export interface Permission {
  readonly action: string;
  readonly resource: string;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reason: string;
}
