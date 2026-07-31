import { ConflictError, type Clock, FixedClock, type DomainEvent } from "../../shared/src/index.js";
import { MemoryQuestionRepository, MemoryQuestionRevisionRepository } from "./memory.js";
import {
  ConfiguredQuestionSafetyCapabilityPolicy,
  createQuestionSafetyApplication,
  type AuditRecordView,
  type QuestionModerationActionView,
  type QuestionModerationCaseView,
  type QuestionModerationStateView,
  type QuestionReportView,
  type QuestionSafetyApplication,
  type QuestionSafetyIdempotencyRecord,
  type QuestionSafetyRepository,
  type QuestionSafetyUnitOfWork,
  type QuestionSourceReferenceView,
  type QuestionTrustSignalsView
} from "./safety.js";

export class MemoryQuestionSafetyRepository implements QuestionSafetyRepository {
  sources = new Map<string, QuestionSourceReferenceView>();
  reports = new Map<string, QuestionReportView>();
  cases = new Map<string, QuestionModerationCaseView>();
  actions = new Map<string, QuestionModerationActionView>();
  states = new Map<string, QuestionModerationStateView>();
  audits: AuditRecordView[] = [];

  async addSource(value: QuestionSourceReferenceView): Promise<void> {
    if (
      [...this.sources.values()].some(
        (item) =>
          item.questionId === value.questionId &&
          item.sourceType === value.sourceType &&
          item.normalizedLocator === value.normalizedLocator &&
          item.status === "active"
      )
    )
      throw new ConflictError("Active source reference already exists");
    this.sources.set(value.id, structuredClone(value));
  }
  async getSource(id: string): Promise<QuestionSourceReferenceView | undefined> {
    return cloneOptional(this.sources.get(id));
  }
  async saveSource(value: QuestionSourceReferenceView, expectedVersion: number): Promise<boolean> {
    const prior = this.sources.get(value.id);
    if (!prior || prior.version !== expectedVersion) return false;
    this.sources.set(value.id, structuredClone(value));
    return true;
  }
  async listSources(
    questionId: string,
    includeRemoved: boolean,
    limit: number,
    offset: number
  ): Promise<readonly QuestionSourceReferenceView[]> {
    return [...this.sources.values()]
      .filter(
        (value) => value.questionId === questionId && (includeRemoved || value.status === "active")
      )
      .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt) || a.id.localeCompare(b.id))
      .slice(offset, offset + limit)
      .map((value) => structuredClone(value));
  }
  async addReport(value: QuestionReportView): Promise<void> {
    if (
      [...this.reports.values()].some(
        (item) =>
          item.questionId === value.questionId &&
          item.reporterId === value.reporterId &&
          item.reasonCode === value.reasonCode &&
          ["open", "under_review"].includes(item.status)
      )
    )
      throw new ConflictError("Active duplicate report");
    this.reports.set(value.id, structuredClone(value));
  }
  async getReport(id: string): Promise<QuestionReportView | undefined> {
    return cloneOptional(this.reports.get(id));
  }
  async saveReport(value: QuestionReportView, expectedVersion: number): Promise<boolean> {
    const prior = this.reports.get(value.id);
    if (!prior || prior.version !== expectedVersion) return false;
    this.reports.set(value.id, structuredClone(value));
    return true;
  }
  async listReports(questionId: string): Promise<readonly QuestionReportView[]> {
    return [...this.reports.values()]
      .filter((value) => value.questionId === questionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .map((value) => structuredClone(value));
  }
  async addCase(value: QuestionModerationCaseView): Promise<void> {
    if (
      [...this.cases.values()].some(
        (item) =>
          item.questionId === value.questionId && !["resolved", "dismissed"].includes(item.status)
      )
    )
      throw new ConflictError("Active moderation case already exists");
    this.cases.set(value.id, structuredClone(value));
  }
  async getCase(id: string): Promise<QuestionModerationCaseView | undefined> {
    return cloneOptional(this.cases.get(id));
  }
  async saveCase(value: QuestionModerationCaseView, expectedVersion: number): Promise<boolean> {
    const prior = this.cases.get(value.id);
    if (!prior || prior.version !== expectedVersion) return false;
    this.cases.set(value.id, structuredClone(value));
    return true;
  }
  async addAction(value: QuestionModerationActionView): Promise<void> {
    this.actions.set(value.id, structuredClone(value));
  }
  async getModerationState(questionId: string): Promise<QuestionModerationStateView | undefined> {
    return cloneOptional(this.states.get(questionId));
  }
  async saveModerationState(
    value: QuestionModerationStateView,
    expectedVersion: number
  ): Promise<boolean> {
    const prior = this.states.get(value.questionId);
    if ((prior?.version ?? 0) !== expectedVersion) return false;
    this.states.set(value.questionId, structuredClone(value));
    return true;
  }
  async addAudit(value: AuditRecordView): Promise<void> {
    this.audits.push(structuredClone(value));
  }
  async listAudit(
    questionId: string,
    limit: number,
    offset: number
  ): Promise<readonly AuditRecordView[]> {
    return this.audits
      .filter((value) => value.questionId === questionId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
      .slice(offset, offset + limit)
      .map((value) => structuredClone(value));
  }
  async trustSignals(
    questionId: string,
    internal: boolean
  ): Promise<QuestionTrustSignalsView | undefined> {
    const sourceCount = [...this.sources.values()].filter(
      (value) => value.questionId === questionId && value.status === "active"
    ).length;
    const state = this.states.get(questionId);
    const openReportCount = [...this.reports.values()].filter(
      (value) => value.questionId === questionId && ["open", "under_review"].includes(value.status)
    ).length;
    return {
      questionId,
      creatorAttributed: true,
      revisionCount: 0,
      sourceCount,
      hasActiveSources: sourceCount > 0,
      framePresent: false,
      frameStale: false,
      relationCount: 0,
      moderationState: state?.state ?? "clear",
      ...(state?.lastReviewedAt ? { lastReviewedAt: state.lastReviewedAt } : {}),
      ...(internal ? { openReportCount } : {})
    };
  }
  snapshot(): unknown {
    return structuredClone({
      sources: [...this.sources],
      reports: [...this.reports],
      cases: [...this.cases],
      actions: [...this.actions],
      states: [...this.states],
      audits: this.audits
    });
  }
  restore(snapshot: unknown): void {
    const value = snapshot as {
      sources: [string, QuestionSourceReferenceView][];
      reports: [string, QuestionReportView][];
      cases: [string, QuestionModerationCaseView][];
      actions: [string, QuestionModerationActionView][];
      states: [string, QuestionModerationStateView][];
      audits: AuditRecordView[];
    };
    this.sources = new Map(value.sources);
    this.reports = new Map(value.reports);
    this.cases = new Map(value.cases);
    this.actions = new Map(value.actions);
    this.states = new Map(value.states);
    this.audits = value.audits;
  }
}

export class MemoryQuestionSafetyUnitOfWork implements QuestionSafetyUnitOfWork {
  readonly questions: MemoryQuestionRepository;
  readonly revisions: MemoryQuestionRevisionRepository;
  readonly safety: MemoryQuestionSafetyRepository;
  private records = new Map<string, { fingerprint: string; response: unknown }>();
  private outbox: DomainEvent[] = [];
  private snapshot:
    | {
        questions: ReturnType<MemoryQuestionRepository["snapshot"]>;
        revisions: ReturnType<MemoryQuestionRevisionRepository["snapshot"]>;
        safety: unknown;
        records: Map<string, { fingerprint: string; response: unknown }>;
        outbox: DomainEvent[];
      }
    | undefined;
  constructor(
    questions = new MemoryQuestionRepository(),
    safety = new MemoryQuestionSafetyRepository(),
    revisions = new MemoryQuestionRevisionRepository()
  ) {
    this.questions = questions;
    this.safety = safety;
    this.revisions = revisions;
  }
  async begin(): Promise<void> {
    if (this.snapshot) throw new ConflictError("Safety transaction already active");
    this.snapshot = {
      questions: this.questions.snapshot(),
      revisions: this.revisions.snapshot(),
      safety: this.safety.snapshot(),
      records: structuredClone(this.records),
      outbox: structuredClone(this.outbox)
    };
  }
  async commit(): Promise<void> {
    if (!this.snapshot) throw new Error("No active safety transaction");
    this.snapshot = undefined;
  }
  async rollback(): Promise<void> {
    if (!this.snapshot) return;
    this.questions.restoreSnapshot(this.snapshot.questions);
    this.revisions.restoreSnapshot(this.snapshot.revisions);
    this.safety.restore(this.snapshot.safety);
    this.records = this.snapshot.records;
    this.outbox = this.snapshot.outbox;
    this.snapshot = undefined;
  }
  async appendOutbox(event: DomainEvent): Promise<void> {
    this.requireActive();
    this.outbox.push(structuredClone(event));
  }
  async getIdempotency(
    scope: string,
    key: string
  ): Promise<{ fingerprint: string; response: unknown } | undefined> {
    this.requireActive();
    return cloneOptional(this.records.get(`${scope}:${key}`));
  }
  async putIdempotency(record: QuestionSafetyIdempotencyRecord): Promise<void> {
    this.requireActive();
    const key = `${record.scope}:${record.key}`;
    if (this.records.has(key)) throw new ConflictError("Idempotency key already exists");
    this.records.set(key, {
      fingerprint: record.fingerprint,
      response: structuredClone(record.response)
    });
  }
  getOutbox(): readonly DomainEvent[] {
    return this.outbox.map((value) => structuredClone(value));
  }
  private requireActive(): void {
    if (!this.snapshot) throw new Error("No active safety transaction");
  }
}

export function createMemoryQuestionSafetyApplication(
  options: {
    clock?: Clock;
    moderatorActors?: readonly string[];
    questions?: MemoryQuestionRepository;
  } = {}
): { application: QuestionSafetyApplication; unit: MemoryQuestionSafetyUnitOfWork } {
  const unit = new MemoryQuestionSafetyUnitOfWork(options.questions);
  return {
    unit,
    application: createQuestionSafetyApplication({
      createUnitOfWork: () => unit,
      capabilities: new ConfiguredQuestionSafetyCapabilityPolicy(
        options.moderatorActors ?? ["moderator"]
      ),
      clock: options.clock ?? new FixedClock(new Date("2026-01-01T00:00:00.000Z"))
    })
  };
}
function cloneOptional<T>(value: T | undefined): T | undefined {
  return value === undefined ? undefined : structuredClone(value);
}
