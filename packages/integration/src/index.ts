export type * from "./contracts.js";

import type {
  GatewayRequest,
  GatewayResponse,
  IntegrationGateway,
  IntegrationContext,
  ProviderAdapter,
  ProviderHealth,
  ProviderKind,
  ProviderRegistry
} from "./contracts.js";

export class LocalProviderRegistry implements ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.descriptor.id, adapter);
  }

  get(providerId: string): ProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  list(kind?: ProviderKind): readonly ProviderAdapter[] {
    return [...this.adapters.values()].filter(
      (adapter) => !kind || adapter.descriptor.kind === kind
    );
  }
}

export class LocalIntegrationGateway implements IntegrationGateway {
  constructor(private readonly registry: ProviderRegistry = new LocalProviderRegistry()) {}

  register(adapter: ProviderAdapter): void {
    this.registry.register(adapter);
  }

  async route<TRequest, TResponse>(
    request: GatewayRequest<TRequest>
  ): Promise<GatewayResponse<TResponse>> {
    const adapter = this.selectAdapter(request.providerKind, request.context, request.providerId);
    if (!adapter) {
      const error = request.providerId
        ? {
            code: "PROVIDER_NOT_FOUND",
            message: `No provider registered for ${request.providerId}`,
            retryable: false,
            providerId: request.providerId
          }
        : {
            code: "PROVIDER_NOT_FOUND",
            message: `No provider registered for ${request.providerKind}`,
            retryable: false
          };
      return {
        requestId: request.id,
        providerId: request.providerId ?? "unresolved",
        ok: false,
        error
      };
    }

    try {
      const payload = await adapter.execute(request.payload, request.context);
      return {
        requestId: request.id,
        providerId: adapter.descriptor.id,
        ok: true,
        payload: payload as TResponse
      };
    } catch (error) {
      return {
        requestId: request.id,
        providerId: adapter.descriptor.id,
        ok: false,
        error: {
          code: "PROVIDER_EXECUTION_FAILED",
          message: error instanceof Error ? error.message : "Provider execution failed",
          retryable: true,
          providerId: adapter.descriptor.id
        }
      };
    }
  }

  async health(providerId?: string): Promise<readonly ProviderHealth[]> {
    const adapters = providerId
      ? [this.registry.get(providerId)].filter(Boolean)
      : this.registry.list();
    const context = this.systemContext(providerId);
    return Promise.all(adapters.map((adapter) => adapter!.health(context)));
  }

  private selectAdapter(
    kind: GatewayRequest["providerKind"],
    context: IntegrationContext,
    providerId?: string
  ): ProviderAdapter | undefined {
    if (providerId) {
      return this.registry.get(providerId);
    }
    const adapters = this.registry.list(kind);
    if (context.offlinePreferred) {
      return (
        adapters.find((adapter) => adapter.descriptor.capabilities.includes("offline")) ??
        adapters[0]
      );
    }
    return adapters[0];
  }

  private systemContext(providerId?: string): IntegrationContext {
    const context: IntegrationContext = {
      correlationId: "system-health",
      capabilities: ["integration:health"]
    };
    return providerId ? { ...context, providerId } : context;
  }
}
