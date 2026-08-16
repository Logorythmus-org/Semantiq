import type { EventId, IdentityId } from "./identifiers.js";

export type CoreDomainEventType =
  | "IdentityCreated"
  | "WorkspaceCreated"
  | "KnowledgeCreated"
  | "KnowledgeUpdated"
  | "QuestionCreated"
  | "QuestionUpdated"
  | "QuestionArchived"
  | "PermissionGranted"
  | "PermissionRevoked"
  | "RelationCreated"
  | "GraphUpdated";

export interface Correlation {
  readonly correlationId: string;
  readonly causationId?: string;
  readonly traceId?: string;
}

export interface CoreDomainEvent<TPayload = unknown> {
  readonly id: EventId;
  readonly type: CoreDomainEventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly actorId?: IdentityId;
  readonly correlation: Correlation;
  readonly payload: TPayload;
}

export interface Command<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly correlation: Correlation;
}

export interface Query<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly correlation: Correlation;
}

export interface EventHandler<TEvent extends CoreDomainEvent = CoreDomainEvent> {
  handle(event: TEvent): Promise<void>;
}

export interface EventBus {
  publish(event: CoreDomainEvent): Promise<void>;
  subscribe(type: CoreDomainEventType, handler: EventHandler): void;
  replay(events: readonly CoreDomainEvent[]): Promise<void>;
  deadLetters(): readonly CoreDomainEvent[];
}

export const createDomainEvent = <TPayload>(
  type: CoreDomainEventType,
  payload: TPayload,
  correlation: Correlation,
  actorId?: IdentityId
): CoreDomainEvent<TPayload> => {
  const base: CoreDomainEvent<TPayload> = {
    id: globalThis.crypto.randomUUID(),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    correlation,
    payload
  };
  return actorId ? { ...base, actorId } : base;
};
