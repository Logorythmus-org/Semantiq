import { describe, it, expect } from 'vitest';
import {
  EventDAGIntegrityAnalyzer,
  EvaluatorAnnotationStore,
  serializeDeterministicEvent
} from '../../packages/semantiq/src/event-schema.js';
import type { BehavioralEventSchema } from '../../packages/semantiq/src/event-schema.js';

describe('Behavioral Event Schema and Evidence Integrity (Prompt 8.5)', () => {
  const event1: BehavioralEventSchema = {
    eventId: 'evt_101',
    schemaVersion: '1.0.0',
    runId: 'run_100',
    actorId: 'agent_evaluator',
    sequenceNumber: 1,
    timestamp: '2026-08-01T10:00:00Z',
    monotonicIndex: 1001,
    eventType: 'ContextReceived',
    primaryVerb: 'read',
    parentEventIds: [],
    causalType: 'direct',
    evidenceRefs: [{ uri: 'file:///tmp/context.json', algorithm: 'sha256', hash: 'abc123hash' }],
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'default' },
    payload: { prompt: 'Analyze dataset' }
  };

  const event2: BehavioralEventSchema = {
    eventId: 'evt_102',
    schemaVersion: '1.0.0',
    runId: 'run_100',
    actorId: 'agent_evaluator',
    sequenceNumber: 2,
    timestamp: '2026-08-01T10:00:01Z',
    monotonicIndex: 1002,
    eventType: 'ActionExecuted',
    primaryVerb: 'execute',
    parentEventIds: ['evt_101'],
    causalType: 'direct',
    evidenceRefs: [{ uri: 'file:///tmp/out.log', algorithm: 'sha256', hash: 'def456hash' }],
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'default' },
    payload: { exitCode: 0 }
  };

  it('serializes events deterministically', () => {
    const json1 = serializeDeterministicEvent(event1);
    const json2 = serializeDeterministicEvent(event1);
    expect(json1).toBe(json2);
  });

  it('validates clean DAG sequence ordering', () => {
    const analyzer = new EventDAGIntegrityAnalyzer();
    const res = analyzer.validateTraceIntegrity([event1, event2]);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('detects duplicate event IDs', () => {
    const analyzer = new EventDAGIntegrityAnalyzer();
    analyzer.addEvent(event1);
    const res = analyzer.addEvent(event1);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('DUPLICATE EVENT');
  });

  it('detects missing parent event IDs', () => {
    const orphanEvent: BehavioralEventSchema = {
      ...event2,
      eventId: 'evt_orphan',
      parentEventIds: ['evt_nonexistent']
    };
    const analyzer = new EventDAGIntegrityAnalyzer();
    const res = analyzer.addEvent(orphanEvent);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('MISSING PARENT');
  });

  it('stores evaluator annotations separately without mutating raw event', () => {
    const store = new EvaluatorAnnotationStore();
    store.addAnnotation({
      annotationId: 'ann_01',
      eventId: 'evt_101',
      evaluatorId: 'human_reviewer',
      scoreDelta: 0.95,
      comment: 'Valid context parsing',
      tags: ['accurate'],
      timestamp: '2026-08-01T10:05:00Z'
    });

    const list = store.getAnnotations('evt_101');
    expect(list.length).toBe(1);
    expect(list[0]?.comment).toBe('Valid context parsing');
    expect(event1.payload).toEqual({ prompt: 'Analyze dataset' });
  });
});
