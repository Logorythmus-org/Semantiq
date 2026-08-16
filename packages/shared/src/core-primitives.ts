import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type EntityId = string;
export type SchemaVersion = number;

export interface IdGenerator {
  generate(): EntityId;
}
export class UuidGenerator implements IdGenerator {
  generate(): EntityId {
    return randomUUID();
  }
}
export function parseId(value: string, label = "id"): EntityId {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) throw new Error(`Invalid ${label}`);
  return value;
}

export interface Clock {
  now(): Date;
}
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
export class FixedClock implements Clock {
  private readonly value: Date;
  constructor(value: Date) {
    this.value = value;
    if (Number.isNaN(value.getTime())) throw new Error("Invalid fixed time");
  }
  now(): Date {
    return new Date(this.value.getTime());
  }
}

export interface AuditMetadata {
  readonly createdAt: Date;
  readonly createdBy?: string;
  readonly updatedAt?: Date;
  readonly updatedBy?: string;
  readonly source?: string;
  readonly correlationId?: string;
  readonly reason?: string;
}

export abstract class Entity {
  private readonly pendingEvents: DomainEvent[] = [];
  public readonly id: EntityId;
  public readonly audit: AuditMetadata | undefined;
  public version: number;
  protected constructor(id: EntityId, audit?: AuditMetadata, version = 0) {
    this.id = id;
    this.audit = audit;
    this.version = version;
    parseId(id, "entity id");
  }
  equals(other: Entity | null | undefined): boolean {
    return Boolean(other && this.constructor === other.constructor && this.id === other.id);
  }
  protected record(event: DomainEvent): void {
    this.pendingEvents.push(event);
  }
  pullEvents(): readonly DomainEvent[] {
    const events = [...this.pendingEvents];
    this.pendingEvents.length = 0;
    return events;
  }
}

export abstract class ValueObject<T extends object> {
  public readonly value: Readonly<T>;
  protected constructor(value: Readonly<T>) {
    this.value = value;
    Object.freeze(value);
  }
  equals(other: ValueObject<T> | null | undefined): boolean {
    return Boolean(other && JSON.stringify(this.value) === JSON.stringify(other.value));
  }
  toJSON(): Readonly<T> {
    return this.value;
  }
}

export interface CorrelationContext {
  readonly correlationId: string;
  readonly causationId?: string;
  readonly requestId?: string;
}
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();
export function runWithCorrelation<T>(context: CorrelationContext, callback: () => T): T {
  return correlationStorage.run(context, callback);
}
export function currentCorrelation(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

export interface DomainEvent<TPayload = unknown> {
  readonly id: EntityId;
  readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId?: EntityId;
  readonly payload: TPayload;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly schemaVersion: SchemaVersion;
  readonly correlation?: CorrelationContext;
}
export function createEvent<T>(
  type: string,
  payload: T,
  options: Omit<DomainEvent<T>, "id" | "type" | "occurredAt" | "payload"> & {
    occurredAt?: Date;
  } = { metadata: {}, schemaVersion: 1 }
): DomainEvent<T> {
  return {
    ...options,
    id: randomUUID(),
    type,
    occurredAt: options.occurredAt ?? new Date(),
    payload
  };
}

export interface Command<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly correlation?: CorrelationContext;
}
export interface Query<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly correlation?: CorrelationContext;
}
export interface CommandHandler<T extends Command = Command, TOutput = unknown> {
  execute(command: T): Promise<TOutput> | TOutput;
}
export interface QueryHandler<T extends Query = Query, TOutput = unknown> {
  execute(query: T): Promise<TOutput> | TOutput;
}

export type ResultErrorCategory =
  | "validation"
  | "domain"
  | "conflict"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "infrastructure";
export interface ResultError {
  readonly code: string;
  readonly message: string;
  readonly category: ResultErrorCategory;
  readonly details?: unknown;
  readonly fieldErrors?: Readonly<Record<string, string>>;
  readonly retryable?: boolean;
}
export type Result<T> =
  | { readonly ok: true; readonly value: T; readonly metadata?: Readonly<Record<string, unknown>> }
  | {
      readonly ok: false;
      readonly error: ResultError;
      readonly metadata?: Readonly<Record<string, unknown>>;
    };
export const success = <T>(value: T, metadata?: Readonly<Record<string, unknown>>): Result<T> => ({
  ok: true,
  value,
  ...(metadata ? { metadata } : {})
});
export const failure = <T = never>(
  error: ResultError,
  metadata?: Readonly<Record<string, unknown>>
): Result<T> => ({ ok: false, error, ...(metadata ? { metadata } : {}) });
export function mapResult<T, U>(result: Result<T>, map: (value: T) => U): Result<U> {
  return result.ok ? success(map(result.value), result.metadata) : result;
}

export interface PageRequest {
  readonly page: number;
  readonly limit: number;
}
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total?: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}
export function pageRequest(page = 1, limit = 25): PageRequest {
  if (!Number.isInteger(page) || page < 1) throw new Error("page must be a positive integer");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new Error("limit must be between 1 and 100");
  return { page, limit };
}
export function createPage<T>(items: readonly T[], request: PageRequest, total?: number): Page<T> {
  return {
    items,
    page: request.page,
    limit: request.limit,
    ...(total === undefined ? {} : { total }),
    hasNext:
      total === undefined ? items.length === request.limit : request.page * request.limit < total,
    hasPrevious: request.page > 1
  };
}

export type Filter = Readonly<Record<string, string | number | boolean>>;
export interface Sort {
  readonly field: string;
  readonly direction: "asc" | "desc";
}
export function validateFilter(filter: Filter, allowedFields: readonly string[]): Filter {
  for (const field of Object.keys(filter))
    if (!allowedFields.includes(field)) throw new Error(`Filtering by ${field} is not allowed`);
  return filter;
}
export function sortBy(
  field: string,
  direction: "asc" | "desc" = "asc",
  allowedFields: readonly string[] = []
): Sort {
  if (allowedFields.length && !allowedFields.includes(field))
    throw new Error(`Sorting by ${field} is not allowed`);
  return { field, direction };
}

export function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ValueObject) return serialize(value.toJSON());
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  return value;
}

export interface Repository<T extends { readonly id: EntityId }> {
  getById(id: EntityId): Promise<T | undefined>;
  add(value: T): Promise<void>;
  update(value: T): Promise<void>;
  remove(id: EntityId): Promise<void>;
  exists(id: EntityId): Promise<boolean>;
  list(request?: PageRequest): Promise<Page<T>>;
}
export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
export class MemoryUnitOfWork implements UnitOfWork {
  private active = false;
  async begin(): Promise<void> {
    if (this.active) throw new Error("Transaction already active");
    this.active = true;
  }
  async commit(): Promise<void> {
    if (!this.active) throw new Error("No active transaction");
    this.active = false;
  }
  async rollback(): Promise<void> {
    this.active = false;
  }
}
export async function withTransaction<T>(unit: UnitOfWork, work: () => Promise<T>): Promise<T> {
  await unit.begin();
  try {
    const value = await work();
    await unit.commit();
    return value;
  } catch (error) {
    await unit.rollback();
    throw error;
  }
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;
export class InMemoryEventDispatcher {
  private readonly handlers = new Map<string, EventHandler[]>();
  subscribe(type: string, handler: EventHandler): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }
  async dispatch(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers.get(event.type) ?? []) await handler(event);
  }
}

export interface IdempotencyRecord {
  readonly key: string;
  readonly scope: string;
  readonly response: unknown;
  readonly expiresAt?: Date;
}
export class InMemoryIdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();
  get(scope: string, key: string): IdempotencyRecord | undefined {
    const record = this.records.get(`${scope}:${key}`);
    if (record?.expiresAt && record.expiresAt <= new Date()) {
      this.records.delete(`${scope}:${key}`);
      return undefined;
    }
    return record;
  }
  put(record: IdempotencyRecord): void {
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(record.key)) throw new Error("Invalid idempotency key");
    const identity = `${record.scope}:${record.key}`;
    if (this.records.has(identity)) throw new Error("Idempotency key already exists");
    this.records.set(identity, record);
  }
}

export interface FeatureFlagProvider {
  isEnabled(name: string, fallback?: boolean): boolean;
  setForTest(name: string, enabled: boolean): void;
}
export class LocalFeatureFlags implements FeatureFlagProvider {
  private readonly flags = new Map<string, boolean>();
  constructor(
    defaults: Readonly<Record<string, boolean>> = {},
    source: Record<string, string | undefined> = process.env
  ) {
    for (const [name, value] of Object.entries(defaults)) this.flags.set(name, value);
    for (const [name, value] of Object.entries(source))
      if (name.startsWith("FEATURE_"))
        this.flags.set(name.slice(8).toLowerCase(), value === "1" || value === "true");
  }
  isEnabled(name: string, fallback = false): boolean {
    return this.flags.get(name) ?? fallback;
  }
  setForTest(name: string, enabled: boolean): void {
    this.flags.set(name, enabled);
  }
}

export interface Capability {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly available: boolean;
  readonly health: HealthStatus;
  readonly operations: readonly string[];
}
export class CapabilityRegistry {
  private readonly capabilities = new Map<string, Capability>();
  register(capability: Capability): void {
    if (this.capabilities.has(capability.name))
      throw new Error(`Capability already registered: ${capability.name}`);
    this.capabilities.set(capability.name, capability);
  }
  get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }
  list(): readonly Capability[] {
    return [...this.capabilities.values()];
  }
}

export interface Plugin {
  readonly metadata: {
    readonly name: string;
    readonly version: string;
    readonly capabilities: readonly string[];
  };
  register(registry: CapabilityRegistry): void | Promise<void>;
  start(): void | Promise<void>;
  health(): HealthCheck;
  stop(): void | Promise<void>;
}
export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export interface HealthCheck {
  readonly component: string;
  readonly status: HealthStatus;
  readonly message?: string;
  readonly latencyMs?: number;
  readonly checkedAt: Date;
  readonly dependencies?: readonly HealthCheck[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export class HealthRegistry {
  private readonly checks = new Map<string, () => HealthCheck | Promise<HealthCheck>>();
  register(component: string, check: () => HealthCheck | Promise<HealthCheck>): void {
    this.checks.set(component, check);
  }
  async check(): Promise<HealthCheck> {
    const checks = await Promise.all([...this.checks.values()].map((check) => check()));
    const status: HealthStatus = checks.some((item) => item.status === "unhealthy")
      ? "unhealthy"
      : checks.some((item) => item.status === "degraded")
        ? "degraded"
        : "healthy";
    return { component: "tech-club", status, checkedAt: new Date(), dependencies: checks };
  }
}

export interface ApiSuccess<T> {
  readonly data: T;
  readonly meta: { readonly correlationId?: string; readonly version: string };
}
export interface ApiError {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
    readonly correlationId?: string;
  };
}
export const apiSuccess = <T>(data: T, version = "1.0", correlationId?: string): ApiSuccess<T> => ({
  data,
  meta: { version, ...(correlationId ? { correlationId } : {}) }
});
export const apiError = (error: ResultError, correlationId?: string): ApiError => ({
  error: {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
    ...(correlationId ? { correlationId } : {})
  }
});
