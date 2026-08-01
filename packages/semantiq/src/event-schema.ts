/**
 * Behavioral Event Schema and Evidence Integrity for SemantIQ Benchmarks (Prompt 8.5).
 * Defines 19 canonical event types, event DAG integrity validation, checksum verification,
 * redaction traceability, and annotation separation.
 */

export type CanonicalEventType =
  | 'EnvironmentDeclared'
  | 'EnvironmentChanged'
  | 'PermissionGranted'
  | 'PermissionDenied'
  | 'PermissionRevoked'
  | 'ContextReceived'
  | 'InterpretationRecorded'
  | 'DecisionProposed'
  | 'DecisionApproved'
  | 'DecisionRejected'
  | 'ActionAttempted'
  | 'ActionExecuted'
  | 'ActionBlocked'
  | 'ResultObserved'
  | 'ConsequenceDetected'
  | 'BoundaryViolated'
  | 'RecoveryStarted'
  | 'RecoveryCompleted'
  | 'RunStopped';

export interface EvidenceChecksum {
  readonly uri: string;
  readonly algorithm: 'sha256';
  readonly hash: string;
}

export interface RedactionMeta {
  readonly isRedacted: boolean;
  readonly redactedFields: readonly string[];
  readonly policyRule: string;
}

export interface BehavioralEventSchema {
  readonly eventId: string;
  readonly schemaVersion: '1.0.0';
  readonly runId: string;
  readonly actorId: string;
  readonly sequenceNumber: number;
  readonly timestamp: string;
  readonly monotonicIndex: number;
  readonly eventType: CanonicalEventType;
  readonly primaryVerb: string;
  readonly secondaryVerbs?: readonly string[];
  readonly subjectRef?: string;
  readonly toolRef?: string;
  readonly resourceRef?: string;
  readonly permissionRef?: string;
  readonly missionRef?: string;
  readonly parentEventIds: readonly string[];
  readonly causalType: 'direct' | 'enabled' | 'triggered' | 'recovered' | 'correlated';
  readonly evidenceRefs: readonly EvidenceChecksum[];
  readonly redactionMeta: RedactionMeta;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface EvaluatorAnnotation {
  readonly annotationId: string;
  readonly eventId: string;
  readonly evaluatorId: string;
  readonly scoreDelta?: number;
  readonly comment: string;
  readonly tags: readonly string[];
  readonly timestamp: string;
}

/**
 * Deterministic JSON Serializer.
 * Produces key-sorted JSON string for stable checksum computation.
 */
export function serializeDeterministicEvent(event: BehavioralEventSchema): string {
  const sortedKeys = Object.keys(event).sort();
  const sortedObj = Object.fromEntries(sortedKeys.map((k) => [k, (event as any)[k]]));
  return JSON.stringify(sortedObj);
}

/**
 * Event DAG Integrity Analyzer.
 * Validates sequence ordering, duplicate events, missing parents, cycle detection, and checksum integrity.
 */
export class EventDAGIntegrityAnalyzer {
  private readonly eventsById = new Map<string, BehavioralEventSchema>();

  addEvent(event: BehavioralEventSchema): { valid: boolean; errors: readonly string[] } {
    const errors: string[] = [];

    // Duplicate event detection
    if (this.eventsById.has(event.eventId)) {
      errors.push(`DUPLICATE EVENT: Event ID '${event.eventId}' is already recorded.`);
    }

    // Missing parent detection
    for (const parentId of event.parentEventIds) {
      if (!this.eventsById.has(parentId)) {
        errors.push(`MISSING PARENT: Parent event ID '${parentId}' not found in DAG.`);
      }
    }

    // Cycle detection check
    if (this.detectCycle(event.eventId, event.parentEventIds)) {
      errors.push(`DAG CYCLE DETECTED: Parent reference creates a causal cycle for event '${event.eventId}'.`);
    }

    if (errors.length === 0) {
      this.eventsById.set(event.eventId, event);
    }

    return { valid: errors.length === 0, errors };
  }

  validateTraceIntegrity(events: readonly BehavioralEventSchema[]): { valid: boolean; errors: readonly string[] } {
    const errors: string[] = [];
    let lastSeq = -1;
    let lastMono = -1;

    for (const evt of events) {
      if (evt.sequenceNumber <= lastSeq) {
        errors.push(`INVALID SEQUENCE: Event '${evt.eventId}' sequence ${evt.sequenceNumber} <= previous ${lastSeq}.`);
      }
      if (evt.monotonicIndex <= lastMono) {
        errors.push(`INVALID MONOTONIC INDEX: Event '${evt.eventId}' monotonic index ${evt.monotonicIndex} <= previous ${lastMono}.`);
      }
      lastSeq = evt.sequenceNumber;
      lastMono = evt.monotonicIndex;

      const addResult = this.addEvent(evt);
      errors.push(...addResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  private detectCycle(eventId: string, parentIds: readonly string[], visited = new Set<string>()): boolean {
    for (const pId of parentIds) {
      if (pId === eventId || visited.has(pId)) return true;
      visited.add(pId);
      const parentEvent = this.eventsById.get(pId);
      if (parentEvent && this.detectCycle(eventId, parentEvent.parentEventIds, new Set(visited))) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Evaluator Annotation Store.
 * Stores evaluator comments separately without mutating immutable source events.
 */
export class EvaluatorAnnotationStore {
  private readonly annotationsByEvent = new Map<string, EvaluatorAnnotation[]>();

  addAnnotation(annotation: EvaluatorAnnotation): void {
    const list = this.annotationsByEvent.get(annotation.eventId) ?? [];
    list.push(annotation);
    this.annotationsByEvent.set(annotation.eventId, list);
  }

  getAnnotations(eventId: string): readonly EvaluatorAnnotation[] {
    return this.annotationsByEvent.get(eventId) ?? [];
  }
}
