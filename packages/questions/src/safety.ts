import { createHash, randomUUID } from "node:crypto";
import {
  type Clock,
  ConflictError,
  type DomainEvent,
  failure,
  success,
  SystemClock
} from "../../shared/src/index.js";
import type { Result } from "../../shared/src/core-primitives.js";
import type { QuestionRepository, QuestionRevisionRepository } from "./contracts.js";
import { QuestionRuntimeError } from "./domain.js";

export const QUESTION_SOURCE_TYPES = [
  "web",
  "book",
  "paper",
  "dataset",
  "document",
  "conversation",
  "observation",
  "experiment",
  "personal_experience",
  "repository",
  "other"
] as const;
export type QuestionSourceReferenceType = (typeof QUESTION_SOURCE_TYPES)[number];
export type ProvenanceClassification =
  "USER_DECLARED" | "SYSTEM_OBSERVED" | "EXTERNALLY_VERIFIED" | "MODERATOR_REVIEWED";
export type SourceVerificationState =
  "declared" | "format_validated" | "externally_verified" | "unavailable" | "disputed" | "removed";
export type SourceReferenceStatus = "active" | "removed";

export const QUESTION_REPORT_REASONS = [
  "spam",
  "harassment",
  "personal_data",
  "illegal_content",
  "dangerous_content",
  "copyright",
  "misleading_context",
  "duplicate",
  "off_topic",
  "other"
] as const;
export type QuestionReportReason = (typeof QUESTION_REPORT_REASONS)[number];
export type QuestionReportStatus = "open" | "under_review" | "resolved" | "dismissed" | "withdrawn";
export type QuestionModerationCaseStatus =
  "open" | "under_review" | "action_required" | "resolved" | "dismissed";
export const QUESTION_MODERATION_ACTIONS = [
  "no_action",
  "mark_under_review",
  "restrict_discovery",
  "archive_question",
  "restore_question",
  "request_revision",
  "dismiss_reports"
] as const;
export type QuestionModerationActionType = (typeof QUESTION_MODERATION_ACTIONS)[number];
export type QuestionModerationState = "clear" | "under_review" | "discovery_restricted";

export interface QuestionSourceReferenceView {
  readonly id: string;
  readonly questionId: string;
  readonly sourceType: QuestionSourceReferenceType;
  readonly title: string;
  readonly locator: string;
  readonly normalizedLocator: string;
  readonly description?: string;
  readonly declaredBy: string;
  readonly declaredAt: string;
  readonly status: SourceReferenceStatus;
  readonly verificationState: SourceVerificationState;
  readonly declaredClassification: "USER_DECLARED";
  readonly verificationClassification: "SYSTEM_OBSERVED";
  readonly version: number;
  readonly removedBy?: string;
  readonly removedAt?: string;
  readonly removalReason?: string;
}
export interface QuestionReportView {
  readonly id: string;
  readonly questionId: string;
  readonly reporterId: string;
  readonly reasonCode: QuestionReportReason;
  readonly description: string;
  readonly status: QuestionReportStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly correlationId: string;
  readonly version: number;
}
export interface QuestionModerationCaseView {
  readonly id: string;
  readonly questionId: string;
  readonly reportIds: readonly string[];
  readonly status: QuestionModerationCaseStatus;
  readonly openedAt: string;
  readonly openedBy: string;
  readonly assignedTo?: string;
  readonly resolution?: string;
  readonly resolvedAt?: string;
  readonly version: number;
}
export interface QuestionModerationActionView {
  readonly id: string;
  readonly caseId: string;
  readonly questionId: string;
  readonly actionType: QuestionModerationActionType;
  readonly actorId: string;
  readonly reason: string;
  readonly appliedAt: string;
  readonly caseVersion: number;
}
export interface QuestionModerationStateView {
  readonly questionId: string;
  readonly state: QuestionModerationState;
  readonly version: number;
  readonly updatedAt: string;
  readonly updatedBy?: string;
  readonly lastReviewedAt?: string;
}
export interface AuditRecordView {
  readonly id: string;
  readonly questionId?: string;
  readonly actorId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly result: "success" | "failure";
  readonly reason?: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}
export interface QuestionTrustSignalsView {
  readonly questionId: string;
  readonly creatorAttributed: boolean;
  readonly revisionCount: number;
  readonly sourceCount: number;
  readonly hasActiveSources: boolean;
  readonly framePresent: boolean;
  readonly frameStale: boolean;
  readonly relationCount: number;
  readonly moderationState: QuestionModerationState;
  readonly lastReviewedAt?: string;
  readonly openReportCount?: number;
}

export interface QuestionSafetyRepository {
  addSource(value: QuestionSourceReferenceView): Promise<void>;
  getSource(id: string): Promise<QuestionSourceReferenceView | undefined>;
  saveSource(value: QuestionSourceReferenceView, expectedVersion: number): Promise<boolean>;
  listSources(
    questionId: string,
    includeRemoved: boolean,
    limit: number,
    offset: number
  ): Promise<readonly QuestionSourceReferenceView[]>;
  addReport(value: QuestionReportView): Promise<void>;
  getReport(id: string): Promise<QuestionReportView | undefined>;
  saveReport(value: QuestionReportView, expectedVersion: number): Promise<boolean>;
  listReports(questionId: string): Promise<readonly QuestionReportView[]>;
  addCase(value: QuestionModerationCaseView): Promise<void>;
  getCase(id: string): Promise<QuestionModerationCaseView | undefined>;
  saveCase(value: QuestionModerationCaseView, expectedVersion: number): Promise<boolean>;
  addAction(value: QuestionModerationActionView): Promise<void>;
  getModerationState(questionId: string): Promise<QuestionModerationStateView | undefined>;
  saveModerationState(
    value: QuestionModerationStateView,
    expectedVersion: number
  ): Promise<boolean>;
  addAudit(value: AuditRecordView): Promise<void>;
  listAudit(questionId: string, limit: number, offset: number): Promise<readonly AuditRecordView[]>;
  trustSignals(
    questionId: string,
    internal: boolean
  ): Promise<QuestionTrustSignalsView | undefined>;
}
export interface QuestionSafetyIdempotencyRecord {
  readonly scope: string;
  readonly key: string;
  readonly fingerprint: string;
  readonly response: unknown;
}
export interface QuestionSafetyUnitOfWork {
  begin(mode?: "read" | "write"): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  readonly questions: QuestionRepository;
  readonly revisions: QuestionRevisionRepository;
  readonly safety: QuestionSafetyRepository;
  appendOutbox(event: DomainEvent): Promise<void>;
  getIdempotency(
    scope: string,
    key: string
  ): Promise<{ fingerprint: string; response: unknown } | undefined>;
  putIdempotency(record: QuestionSafetyIdempotencyRecord): Promise<void>;
}
export interface QuestionSafetyCapabilityPolicy {
  canReviewQuestionReports(actorId: string): boolean;
  canApplyQuestionModerationAction(actorId: string): boolean;
  canReadInternalQuestionSafety(actorId: string): boolean;
}
export class ConfiguredQuestionSafetyCapabilityPolicy implements QuestionSafetyCapabilityPolicy {
  private readonly actors: ReadonlySet<string>;
  constructor(actors: Iterable<string>) {
    this.actors = new Set([...actors].filter(Boolean));
  }
  canReviewQuestionReports(actorId: string): boolean {
    return this.actors.has(actorId);
  }
  canApplyQuestionModerationAction(actorId: string): boolean {
    return this.actors.has(actorId);
  }
  canReadInternalQuestionSafety(actorId: string): boolean {
    return this.actors.has(actorId);
  }
}

export interface AddQuestionSourceReferenceCommand {
  readonly questionId: string;
  readonly sourceType: QuestionSourceReferenceType;
  readonly title: string;
  readonly locator: string;
  readonly description?: string;
  readonly actorId: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}
export interface RemoveQuestionSourceReferenceCommand {
  readonly referenceId: string;
  readonly expectedVersion: number;
  readonly actorId: string;
  readonly reason: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}
export interface SubmitQuestionReportCommand {
  readonly questionId: string;
  readonly reporterId: string;
  readonly reasonCode: QuestionReportReason;
  readonly description: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}
export interface WithdrawQuestionReportCommand {
  readonly reportId: string;
  readonly expectedVersion: number;
  readonly reporterId: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}
export interface OpenQuestionModerationCaseCommand {
  readonly questionId: string;
  readonly reportIds: readonly string[];
  readonly actorId: string;
  readonly reason: string;
  readonly assignedTo?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}
export interface ApplyQuestionModerationActionCommand {
  readonly caseId: string;
  readonly actionType: QuestionModerationActionType;
  readonly expectedVersion: number;
  readonly actorId: string;
  readonly reason: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

type SafetyResult<T> = Promise<Result<T>>;
export interface QuestionSafetyApplication {
  addSource(command: AddQuestionSourceReferenceCommand): SafetyResult<QuestionSourceReferenceView>;
  removeSource(
    command: RemoveQuestionSourceReferenceCommand
  ): SafetyResult<QuestionSourceReferenceView>;
  listSources(query: {
    questionId: string;
    actorId?: string;
    includeRemoved?: boolean;
    limit?: number;
    offset?: number;
  }): SafetyResult<readonly QuestionSourceReferenceView[]>;
  getSource(query: {
    referenceId: string;
    actorId?: string;
  }): SafetyResult<QuestionSourceReferenceView>;
  submitReport(command: SubmitQuestionReportCommand): SafetyResult<QuestionReportView>;
  withdrawReport(command: WithdrawQuestionReportCommand): SafetyResult<QuestionReportView>;
  listReports(query: {
    questionId: string;
    actorId: string;
  }): SafetyResult<readonly QuestionReportView[]>;
  openCase(command: OpenQuestionModerationCaseCommand): SafetyResult<QuestionModerationCaseView>;
  applyAction(
    command: ApplyQuestionModerationActionCommand
  ): SafetyResult<QuestionModerationActionView>;
  listAudit(query: {
    questionId: string;
    actorId: string;
    limit?: number;
    offset?: number;
  }): SafetyResult<readonly AuditRecordView[]>;
  trustSignals(query: {
    questionId: string;
    actorId?: string;
  }): SafetyResult<QuestionTrustSignalsView>;
  canReadQuestion(questionId: string, actorId?: string): Promise<boolean>;
}

export function createQuestionSafetyApplication(dependencies: {
  readonly createUnitOfWork: () => QuestionSafetyUnitOfWork;
  readonly capabilities: QuestionSafetyCapabilityPolicy;
  readonly clock?: Clock;
}): QuestionSafetyApplication {
  const clock = dependencies.clock ?? new SystemClock();
  const execute = async <T>(
    scope: string,
    command: Record<string, unknown>,
    work: (unit: QuestionSafetyUnitOfWork, now: Date) => Promise<T>
  ): SafetyResult<T> => {
    const unit = dependencies.createUnitOfWork();
    try {
      validateId(command.correlationId, "correlation ID");
      const key = typeof command.idempotencyKey === "string" ? command.idempotencyKey : undefined;
      if (key) validateBounded(key, "idempotency key", 1, 200);
      const fingerprint = hash(stable(command, ["idempotencyKey"]));
      await unit.begin();
      if (key) {
        const prior = await unit.getIdempotency(scope, key);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw runtime(
              "idempotency_conflict",
              "Idempotency key was reused with different data",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response as T);
        }
      }
      const response = await work(unit, clock.now());
      if (key) await unit.putIdempotency({ scope, key, fingerprint, response });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapError<T>(error);
    }
  };
  const read = async <T>(work: (unit: QuestionSafetyUnitOfWork) => Promise<T>): SafetyResult<T> => {
    const unit = dependencies.createUnitOfWork();
    try {
      await unit.begin("read");
      const value = await work(unit);
      await unit.commit();
      return success(value);
    } catch (error) {
      await unit.rollback();
      return mapError<T>(error);
    }
  };

  return {
    addSource: (command) =>
      execute(
        "question.source.add",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          const question = await unit.questions.getById(command.questionId);
          if (!question) throw runtime("question_not_found", "Question not found", "not_found");
          if (question.status !== "published")
            throw runtime(
              "question_source_inactive",
              "Sources can only be attached to active Questions",
              "domain"
            );
          if (question.creatorId !== command.actorId)
            throw runtime(
              "question_source_forbidden",
              "Only the Question creator may attach sources",
              "forbidden"
            );
          const locator = validateLocator(command.sourceType, command.locator);
          const value: QuestionSourceReferenceView = {
            id: randomUUID(),
            questionId: question.id,
            sourceType: validateEnum(command.sourceType, QUESTION_SOURCE_TYPES, "source type"),
            title: validateText(command.title, "title", 1, 300),
            locator: validateText(command.locator, "locator", 1, 1000),
            normalizedLocator: locator,
            ...(command.description
              ? { description: validateText(command.description, "description", 1, 1000) }
              : {}),
            declaredBy: command.actorId,
            declaredAt: now.toISOString(),
            status: "active",
            verificationState:
              locator === command.locator.trim() && command.sourceType === "other"
                ? "declared"
                : "format_validated",
            declaredClassification: "USER_DECLARED",
            verificationClassification: "SYSTEM_OBSERVED",
            version: 1
          };
          await unit.safety.addSource(value);
          await append(
            unit,
            "question.source.added",
            value.questionId,
            command.correlationId,
            command.causationId,
            {
              referenceId: value.id,
              questionId: value.questionId,
              sourceType: value.sourceType,
              actorId: command.actorId,
              referenceVersion: 1
            }
          );
          await audit(
            unit,
            now,
            command,
            "question.source.added",
            "QuestionSourceReference",
            value.id,
            value.questionId,
            undefined,
            { sourceType: value.sourceType }
          );
          return value;
        }
      ),
    removeSource: (command) =>
      execute(
        "question.source.remove",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          const prior = await unit.safety.getSource(command.referenceId);
          if (!prior)
            throw runtime(
              "question_source_not_found",
              "Question source reference not found",
              "not_found"
            );
          const question = await unit.questions.getById(prior.questionId);
          if (question?.creatorId !== command.actorId)
            throw runtime(
              "question_source_forbidden",
              "Only the Question creator may remove sources",
              "forbidden"
            );
          if (prior.status !== "active")
            throw runtime(
              "question_source_already_removed",
              "Question source reference is already removed",
              "conflict"
            );
          if (command.expectedVersion !== prior.version) throw versionConflict();
          const value: QuestionSourceReferenceView = {
            ...prior,
            status: "removed",
            verificationState: "removed",
            version: prior.version + 1,
            removedBy: command.actorId,
            removedAt: now.toISOString(),
            removalReason: validateText(command.reason, "reason", 1, 500)
          };
          if (!(await unit.safety.saveSource(value, command.expectedVersion)))
            throw versionConflict();
          await append(
            unit,
            "question.source.removed",
            value.questionId,
            command.correlationId,
            command.causationId,
            {
              referenceId: value.id,
              questionId: value.questionId,
              sourceType: value.sourceType,
              actorId: command.actorId,
              referenceVersion: value.version
            }
          );
          await audit(
            unit,
            now,
            command,
            "question.source.removed",
            "QuestionSourceReference",
            value.id,
            value.questionId,
            command.reason
          );
          return value;
        }
      ),
    listSources: (query) =>
      read(async (unit) => {
        const state = await unit.safety.getModerationState(query.questionId);
        const internal = Boolean(
          query.actorId && dependencies.capabilities.canReadInternalQuestionSafety(query.actorId)
        );
        if (state?.state === "discovery_restricted" && !internal)
          throw runtime("question_not_found", "Question not found", "not_found");
        if (query.includeRemoved && !internal)
          throw runtime(
            "question_safety_forbidden",
            "Internal provenance access is required",
            "forbidden"
          );
        return unit.safety.listSources(
          query.questionId,
          query.includeRemoved ?? false,
          boundedInt(query.limit, 25, 1, 100),
          boundedInt(query.offset, 0, 0, 10_000)
        );
      }),
    getSource: (query) =>
      read(async (unit) => {
        const value = await unit.safety.getSource(query.referenceId);
        const internal = Boolean(
          query.actorId && dependencies.capabilities.canReadInternalQuestionSafety(query.actorId)
        );
        if (!value || (value.status === "removed" && !internal))
          throw runtime(
            "question_source_not_found",
            "Question source reference not found",
            "not_found"
          );
        return value;
      }),
    submitReport: (command) =>
      execute(
        "question.report.submit",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          validateId(command.reporterId, "reporter ID");
          if (!(await unit.questions.exists(command.questionId)))
            throw runtime("question_not_found", "Question not found", "not_found");
          const value: QuestionReportView = {
            id: randomUUID(),
            questionId: command.questionId,
            reporterId: command.reporterId,
            reasonCode: validateEnum(command.reasonCode, QUESTION_REPORT_REASONS, "report reason"),
            description: validateText(command.description, "description", 10, 1000),
            status: "open",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            correlationId: command.correlationId,
            version: 1
          };
          await unit.safety.addReport(value);
          await append(
            unit,
            "question.reported",
            value.questionId,
            command.correlationId,
            command.causationId,
            {
              reportId: value.id,
              questionId: value.questionId,
              reasonCode: value.reasonCode,
              reporterId: value.reporterId,
              reportVersion: 1
            }
          );
          await audit(
            unit,
            now,
            command,
            "question.report.submitted",
            "QuestionReport",
            value.id,
            value.questionId,
            undefined,
            { reasonCode: value.reasonCode }
          );
          return value;
        }
      ),
    withdrawReport: (command) =>
      execute(
        "question.report.withdraw",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          const prior = await unit.safety.getReport(command.reportId);
          if (!prior)
            throw runtime("question_report_not_found", "Question report not found", "not_found");
          if (prior.reporterId !== command.reporterId)
            throw runtime(
              "question_report_forbidden",
              "Only the reporter may withdraw this report",
              "forbidden"
            );
          if (prior.status !== "open")
            throw runtime(
              "question_report_not_withdrawable",
              "Only open reports may be withdrawn",
              "domain"
            );
          if (prior.version !== command.expectedVersion) throw versionConflict();
          const value = {
            ...prior,
            status: "withdrawn" as const,
            updatedAt: now.toISOString(),
            version: prior.version + 1
          };
          if (!(await unit.safety.saveReport(value, command.expectedVersion)))
            throw versionConflict();
          await append(
            unit,
            "question.report.withdrawn",
            value.questionId,
            command.correlationId,
            command.causationId,
            {
              reportId: value.id,
              questionId: value.questionId,
              reporterId: value.reporterId,
              reportVersion: value.version
            }
          );
          await audit(
            unit,
            now,
            command,
            "question.report.withdrawn",
            "QuestionReport",
            value.id,
            value.questionId,
            command.reason
          );
          return value;
        }
      ),
    listReports: (query) =>
      read(async (unit) => {
        requireCapability(dependencies.capabilities.canReviewQuestionReports(query.actorId));
        return unit.safety.listReports(query.questionId);
      }),
    openCase: (command) =>
      execute(
        "question.moderation.case.open",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          requireCapability(dependencies.capabilities.canReviewQuestionReports(command.actorId));
          if (!(await unit.questions.exists(command.questionId)))
            throw runtime("question_not_found", "Question not found", "not_found");
          const reportIds = [...new Set(command.reportIds)];
          if (!reportIds.length || reportIds.length > 100)
            throw runtime(
              "question_case_reports_invalid",
              "A case requires 1 to 100 unique reports",
              "validation"
            );
          for (const id of reportIds) {
            const report = await unit.safety.getReport(id);
            if (!report || report.questionId !== command.questionId || report.status !== "open")
              throw runtime(
                "question_case_report_invalid",
                "Case reports must be open and belong to the Question",
                "domain"
              );
          }
          const value: QuestionModerationCaseView = {
            id: randomUUID(),
            questionId: command.questionId,
            reportIds,
            status: "open",
            openedAt: now.toISOString(),
            openedBy: command.actorId,
            ...(command.assignedTo ? { assignedTo: command.assignedTo } : {}),
            version: 1
          };
          await unit.safety.addCase(value);
          const priorState = await unit.safety.getModerationState(value.questionId);
          if (
            !(await unit.safety.saveModerationState(
              {
                questionId: value.questionId,
                state: "under_review",
                version: (priorState?.version ?? 0) + 1,
                updatedAt: now.toISOString(),
                updatedBy: command.actorId,
                lastReviewedAt: now.toISOString()
              },
              priorState?.version ?? 0
            ))
          )
            throw versionConflict();
          for (const id of reportIds) {
            const report = (await unit.safety.getReport(id))!;
            await unit.safety.saveReport(
              {
                ...report,
                status: "under_review",
                updatedAt: now.toISOString(),
                version: report.version + 1
              },
              report.version
            );
          }
          await append(
            unit,
            "question.moderation.case.opened",
            value.questionId,
            command.correlationId,
            command.causationId,
            {
              caseId: value.id,
              questionId: value.questionId,
              actorId: command.actorId,
              caseVersion: 1,
              reportCount: reportIds.length
            }
          );
          await audit(
            unit,
            now,
            command,
            "question.moderation.case.opened",
            "QuestionModerationCase",
            value.id,
            value.questionId,
            command.reason,
            { reportCount: reportIds.length }
          );
          return value;
        }
      ),
    applyAction: (command) =>
      execute(
        "question.moderation.action.apply",
        command as unknown as Record<string, unknown>,
        async (unit, now) => {
          requireCapability(
            dependencies.capabilities.canApplyQuestionModerationAction(command.actorId)
          );
          const prior = await unit.safety.getCase(command.caseId);
          if (!prior)
            throw runtime(
              "question_moderation_case_not_found",
              "Question moderation case not found",
              "not_found"
            );
          if (["resolved", "dismissed"].includes(prior.status))
            throw runtime(
              "question_moderation_case_closed",
              "Closed moderation cases cannot be changed",
              "domain"
            );
          if (prior.version !== command.expectedVersion) throw versionConflict();
          const actionType = validateEnum(
            command.actionType,
            QUESTION_MODERATION_ACTIONS,
            "moderation action"
          );
          const next = actionTransition(actionType);
          if (actionType === "archive_question" || actionType === "restore_question") {
            const question = await unit.questions.getById(prior.questionId);
            if (!question) throw runtime("question_not_found", "Question not found", "not_found");
            const expectedQuestionVersion = question.version;
            const mutation =
              actionType === "archive_question"
                ? question.moderateArchive({
                    actorId: command.actorId,
                    revisionId: randomUUID(),
                    correlationId: command.correlationId,
                    reason: command.reason,
                    ...(command.causationId ? { causationId: command.causationId } : {}),
                    clock
                  })
                : question.moderateRestore({
                    actorId: command.actorId,
                    revisionId: randomUUID(),
                    correlationId: command.correlationId,
                    reason: command.reason,
                    ...(command.causationId ? { causationId: command.causationId } : {}),
                    clock
                  });
            if (!(await unit.questions.saveWithExpectedVersion(question, expectedQuestionVersion)))
              throw versionConflict();
            await unit.revisions.add(mutation.revision);
            await unit.appendOutbox(mutation.event);
          }
          const statePrior = await unit.safety.getModerationState(prior.questionId);
          const state: QuestionModerationStateView = {
            questionId: prior.questionId,
            state: next.state,
            version: (statePrior?.version ?? 0) + 1,
            updatedAt: now.toISOString(),
            updatedBy: command.actorId,
            lastReviewedAt: now.toISOString()
          };
          if (!(await unit.safety.saveModerationState(state, statePrior?.version ?? 0)))
            throw versionConflict();
          const updated: QuestionModerationCaseView = {
            ...prior,
            status: next.caseStatus,
            version: prior.version + 1,
            ...(next.closed
              ? {
                  resolution: validateText(command.reason, "reason", 1, 500),
                  resolvedAt: now.toISOString()
                }
              : {})
          };
          if (!(await unit.safety.saveCase(updated, prior.version))) throw versionConflict();
          if (next.closed)
            for (const id of prior.reportIds) {
              const report = await unit.safety.getReport(id);
              if (report && report.status === "under_review")
                await unit.safety.saveReport(
                  {
                    ...report,
                    status: actionType === "dismiss_reports" ? "dismissed" : "resolved",
                    updatedAt: now.toISOString(),
                    version: report.version + 1
                  },
                  report.version
                );
            }
          const action: QuestionModerationActionView = {
            id: randomUUID(),
            caseId: prior.id,
            questionId: prior.questionId,
            actionType,
            actorId: command.actorId,
            reason: validateText(command.reason, "reason", 1, 500),
            appliedAt: now.toISOString(),
            caseVersion: updated.version
          };
          await unit.safety.addAction(action);
          await append(
            unit,
            "question.moderation.action.applied",
            action.questionId,
            command.correlationId,
            command.causationId,
            {
              actionId: action.id,
              caseId: action.caseId,
              questionId: action.questionId,
              actionType,
              actorId: action.actorId,
              caseVersion: action.caseVersion
            }
          );
          if (next.closed)
            await append(
              unit,
              "question.moderation.case.resolved",
              action.questionId,
              command.correlationId,
              action.id,
              {
                caseId: action.caseId,
                questionId: action.questionId,
                actorId: action.actorId,
                caseVersion: action.caseVersion,
                status: next.caseStatus
              }
            );
          await audit(
            unit,
            now,
            command,
            "question.moderation.action.applied",
            "QuestionModerationAction",
            action.id,
            action.questionId,
            command.reason,
            { actionType, moderationState: next.state }
          );
          return action;
        }
      ),
    listAudit: (query) =>
      read(async (unit) => {
        requireCapability(dependencies.capabilities.canReadInternalQuestionSafety(query.actorId));
        return unit.safety.listAudit(
          query.questionId,
          boundedInt(query.limit, 50, 1, 100),
          boundedInt(query.offset, 0, 0, 10_000)
        );
      }),
    trustSignals: (query) =>
      read(async (unit) => {
        const internal = Boolean(
          query.actorId && dependencies.capabilities.canReadInternalQuestionSafety(query.actorId)
        );
        const value = await unit.safety.trustSignals(query.questionId, internal);
        if (!value) throw runtime("question_not_found", "Question not found", "not_found");
        return value;
      }),
    canReadQuestion: async (questionId, actorId) => {
      const result = await read(async (unit) => unit.safety.getModerationState(questionId));
      return (
        result.ok &&
        (result.value?.state !== "discovery_restricted" ||
          Boolean(actorId && dependencies.capabilities.canReadInternalQuestionSafety(actorId)))
      );
    }
  };
}

function actionTransition(action: QuestionModerationActionType): {
  caseStatus: QuestionModerationCaseStatus;
  state: QuestionModerationState;
  closed: boolean;
} {
  if (action === "restrict_discovery")
    return { caseStatus: "action_required", state: "discovery_restricted", closed: false };
  if (action === "mark_under_review" || action === "request_revision")
    return {
      caseStatus: action === "request_revision" ? "action_required" : "under_review",
      state: "under_review",
      closed: false
    };
  return {
    caseStatus: action === "dismiss_reports" ? "dismissed" : "resolved",
    state: "clear",
    closed: true
  };
}
async function append(
  unit: QuestionSafetyUnitOfWork,
  type: string,
  aggregateId: string,
  correlationId: string,
  causationId: string | undefined,
  payload: Readonly<Record<string, unknown>>
): Promise<void> {
  await unit.appendOutbox({
    id: randomUUID(),
    type,
    occurredAt: new Date(),
    aggregateId,
    payload,
    metadata: { correlationId, ...(causationId ? { causationId } : {}) },
    schemaVersion: 1,
    correlation: { correlationId, ...(causationId ? { causationId } : {}) }
  });
}
async function audit(
  unit: QuestionSafetyUnitOfWork,
  now: Date,
  command: object,
  action: string,
  targetType: string,
  targetId: string,
  questionId: string,
  reason?: string,
  metadata: Readonly<Record<string, string | number | boolean | null>> = {}
): Promise<void> {
  const values = command as Readonly<Record<string, unknown>>;
  validateAuditMetadata(metadata);
  await unit.safety.addAudit({
    id: randomUUID(),
    questionId,
    actorId: String(values.actorId ?? values.reporterId ?? "system"),
    action,
    targetType,
    targetId,
    occurredAt: now.toISOString(),
    correlationId: String(values.correlationId),
    ...(values.causationId ? { causationId: String(values.causationId) } : {}),
    result: "success",
    ...(reason ? { reason: validateText(reason, "reason", 1, 500) } : {}),
    metadata
  });
}
export function normalizeSourceLocator(type: QuestionSourceReferenceType, value: string): string {
  const locator = validateText(value, "locator", 1, 1000).normalize("NFKC");
  if (type === "web") {
    let url: URL;
    try {
      url = new URL(locator);
    } catch {
      throw runtime(
        "question_source_locator_invalid",
        "Web source locator must be a valid HTTP(S) URL",
        "validation"
      );
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw runtime(
        "question_source_locator_invalid",
        "Web source locator must use HTTP(S)",
        "validation"
      );
    url.hash = "";
    return url.toString();
  }
  if (type === "paper" && /^doi:\s*/i.test(locator))
    return locator.replace(/^doi:\s*/i, "").toLowerCase();
  if (type === "paper" && /^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(locator))
    return locator.toLowerCase();
  if (type === "book") {
    const isbn = locator
      .replace(/^isbn:?\s*/i, "")
      .replace(/[ -]/g, "")
      .toUpperCase();
    if (!/^(?:\d{9}[\dX]|\d{13})$/.test(isbn))
      throw runtime(
        "question_source_locator_invalid",
        "Book locator must be an ISBN-like identifier",
        "validation"
      );
    return isbn;
  }
  return locator.toLocaleLowerCase("en-US");
}
function validateLocator(type: QuestionSourceReferenceType, value: string): string {
  validateEnum(type, QUESTION_SOURCE_TYPES, "source type");
  return normalizeSourceLocator(type, value);
}
function validateAuditMetadata(value: Readonly<Record<string, unknown>>): void {
  const entries = Object.entries(value);
  if (entries.length > 16 || JSON.stringify(value).length > 2048)
    throw runtime(
      "question_audit_metadata_invalid",
      "Audit metadata exceeds its limit",
      "validation"
    );
  for (const [key, item] of entries) {
    if (
      /token|secret|password|idempotency/i.test(key) ||
      (item !== null && !["string", "number", "boolean"].includes(typeof item)) ||
      (typeof item === "string" && item.length > 256)
    )
      throw runtime(
        "question_audit_metadata_invalid",
        "Audit metadata contains an unsupported field",
        "validation"
      );
  }
}
function validateText(value: string, field: string, min: number, max: number): string {
  const result = value?.replace(/\r\n?/g, "\n").trim();
  const length = [...(result ?? "")].length;
  if (length < min || length > max || [...result].some(isDisallowedControl))
    throw runtime(
      `question_${field.replaceAll(" ", "_")}_invalid`,
      `${field} must contain ${min} to ${max} safe characters`,
      "validation"
    );
  return result;
}
function isDisallowedControl(value: string): boolean {
  const code = value.codePointAt(0) ?? 0;
  return (
    (code >= 0 && code <= 8) ||
    code === 11 ||
    code === 12 ||
    (code >= 14 && code <= 31) ||
    code === 127
  );
}
function validateBounded(value: string, field: string, min: number, max: number): void {
  validateText(value, field, min, max);
}
function validateId(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))
    throw runtime(
      `question_${field.replaceAll(" ", "_")}_invalid`,
      `Invalid ${field}`,
      "validation"
    );
}
function validateEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw runtime(
      `question_${field.replaceAll(" ", "_")}_invalid`,
      `Unsupported ${field}`,
      "validation"
    );
  return value as T;
}
function boundedInt(value: number | undefined, fallback: number, min: number, max: number): number {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < min || result > max)
    throw runtime(
      "question_pagination_invalid",
      "Pagination is outside the supported range",
      "validation"
    );
  return result;
}
function requireCapability(allowed: boolean): void {
  if (!allowed)
    throw runtime(
      "question_moderation_forbidden",
      "Question moderation capability is required",
      "forbidden"
    );
}
function versionConflict(): QuestionRuntimeError {
  return runtime(
    "question_safety_version_conflict",
    "Question safety record version conflict",
    "conflict"
  );
}
function runtime(
  code: string,
  message: string,
  category: "validation" | "domain" | "conflict" | "not_found" | "forbidden"
): QuestionRuntimeError {
  return new QuestionRuntimeError(code, message, category);
}
function mapError<T>(error: unknown): Result<T> {
  if (error instanceof QuestionRuntimeError)
    return failure({
      code: error.code,
      message: error.message,
      category: error.category,
      ...(error.details === undefined ? {} : { details: error.details })
    });
  if (error instanceof ConflictError)
    return failure({
      code: "question_safety_conflict",
      message: error.message,
      category: "conflict"
    });
  return failure({
    code: "question_safety_unavailable",
    message: "Question safety operation could not be completed",
    category: "infrastructure",
    retryable: true
  });
}
function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function stable(value: Readonly<Record<string, unknown>>, omitted: readonly string[]): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !omitted.includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
    )
  );
}

export interface QuestionRateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}
export class LocalFixedWindowQuestionRateLimiter {
  private readonly buckets = new Map<string, { count: number; startsAt: number }>();
  private readonly limits: Readonly<Record<string, number>>;
  private readonly clock: Clock;
  private readonly windowMs: number;
  private readonly maxBuckets: number;
  private readonly disabled: boolean;
  constructor(
    limits: Readonly<Record<string, number>>,
    clock: Clock = new SystemClock(),
    windowMs = 60_000,
    maxBuckets = 10_000,
    disabled = false
  ) {
    this.limits = limits;
    this.clock = clock;
    this.windowMs = windowMs;
    this.maxBuckets = maxBuckets;
    this.disabled = disabled;
  }
  consume(operation: string, actorOrClient: string): QuestionRateLimitDecision {
    if (this.disabled) return { allowed: true, retryAfterSeconds: 0 };
    const limit = this.limits[operation];
    if (!limit) return { allowed: true, retryAfterSeconds: 0 };
    const now = this.clock.now().getTime();
    const key = `${operation}:${hash(actorOrClient).slice(0, 24)}`;
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startsAt >= this.windowMs) {
      bucket = { count: 0, startsAt: now };
      this.buckets.set(key, bucket);
    }
    if (this.buckets.size > this.maxBuckets)
      for (const [candidate, value] of this.buckets) {
        if (now - value.startsAt >= this.windowMs || this.buckets.size > this.maxBuckets)
          this.buckets.delete(candidate);
        else break;
      }
    if (bucket.count >= limit)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.startsAt + this.windowMs - now) / 1000))
      };
    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }
  size(): number {
    return this.buckets.size;
  }
}
