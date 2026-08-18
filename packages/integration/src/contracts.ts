export type ProviderKind =
  | "ai"
  | "repository"
  | "identity"
  | "search"
  | "storage"
  | "notification"
  | "wallet"
  | "payment"
  | "workspace"
  | "mcp"
  | "webhook"
  | "protocol";

export type AuthMethod =
  | "oauth2"
  | "oidc"
  | "api-key"
  | "jwt"
  | "personal-access-token"
  | "local-credentials"
  | "service-account"
  | "passkey"
  | "semantic-identity";

export interface ProviderHealth {
  readonly status: "healthy" | "degraded" | "unhealthy" | "unknown";
  readonly checkedAt: string;
  readonly latencyMs?: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface ProviderDescriptor {
  readonly id: string;
  readonly kind: ProviderKind;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
  readonly authMethods: readonly AuthMethod[];
  readonly configurationKeys: readonly string[];
}

export interface IntegrationContext {
  readonly actorId?: string;
  readonly sessionId?: string;
  readonly workspaceId?: string;
  readonly providerId?: string;
  readonly correlationId: string;
  readonly capabilities: readonly string[];
  readonly offlinePreferred?: boolean;
}

export interface ProviderAdapter<TRequest = unknown, TResponse = unknown> {
  readonly descriptor: ProviderDescriptor;
  health(context: IntegrationContext): Promise<ProviderHealth>;
  execute(request: TRequest, context: IntegrationContext): Promise<TResponse>;
}

export interface ProviderRegistry {
  register(adapter: ProviderAdapter): void;
  get(providerId: string): ProviderAdapter | undefined;
  list(kind?: ProviderKind): readonly ProviderAdapter[];
}

export interface GatewayRequest<TPayload = unknown> {
  readonly id: string;
  readonly operation: string;
  readonly providerKind: ProviderKind;
  readonly providerId?: string;
  readonly payload: TPayload;
  readonly context: IntegrationContext;
  readonly timeoutMs?: number;
  readonly priority?: "low" | "normal" | "high" | "critical";
}

export interface GatewayResponse<TPayload = unknown> {
  readonly requestId: string;
  readonly providerId: string;
  readonly ok: boolean;
  readonly payload?: TPayload;
  readonly error?: IntegrationError;
}

export interface IntegrationGateway {
  route<TRequest, TResponse>(
    request: GatewayRequest<TRequest>
  ): Promise<GatewayResponse<TResponse>>;
  health(providerId?: string): Promise<readonly ProviderHealth[]>;
}

export interface IntegrationError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly providerId?: string;
}

export interface CredentialHandle {
  readonly id: string;
  readonly method: AuthMethod;
  readonly providerId: string;
  readonly scopes: readonly string[];
  readonly expiresAt?: string;
}

export interface AuthProvider {
  authenticate(
    providerId: string,
    method: AuthMethod,
    context: IntegrationContext
  ): Promise<CredentialHandle>;
  refresh(handle: CredentialHandle, context: IntegrationContext): Promise<CredentialHandle>;
  revoke(handle: CredentialHandle, context: IntegrationContext): Promise<void>;
}

export interface AIRequest {
  readonly model?: string;
  readonly input: unknown;
  readonly stream?: boolean;
  readonly tools?: readonly string[];
  readonly structuredOutputSchema?: unknown;
}

export interface AIResponse {
  readonly model: string;
  readonly output: unknown;
  readonly usage?: Readonly<Record<string, number>>;
}

export interface AIProvider extends ProviderAdapter<AIRequest, AIResponse> {
  models(context: IntegrationContext): Promise<readonly string[]>;
}

export interface RepositoryProvider extends ProviderAdapter {
  cloneRepository(url: string, targetPath: string, context: IntegrationContext): Promise<void>;
  search(query: string, context: IntegrationContext): Promise<readonly unknown[]>;
}

export interface WorkspaceProvider extends ProviderAdapter {
  upload(path: string, data: unknown, context: IntegrationContext): Promise<string>;
  download(remoteId: string, context: IntegrationContext): Promise<unknown>;
}

export interface WalletProvider extends ProviderAdapter {
  connectProvider(context: IntegrationContext): Promise<void>;
  disconnectProvider(context: IntegrationContext): Promise<void>;
}

export interface PaymentProvider extends ProviderAdapter {
  createPaymentIntent(
    amount: number,
    currency: string,
    context: IntegrationContext
  ): Promise<unknown>;
}

export interface MCPProvider extends ProviderAdapter {
  discoverTools(context: IntegrationContext): Promise<readonly string[]>;
  executeTool(toolName: string, input: unknown, context: IntegrationContext): Promise<unknown>;
}

export interface WebhookEndpoint {
  readonly id: string;
  readonly direction: "incoming" | "outgoing";
  readonly version: string;
  readonly signingRequired: boolean;
  readonly filters: readonly string[];
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly timeoutMs: number;
  readonly circuitBreakerEnabled: boolean;
}
