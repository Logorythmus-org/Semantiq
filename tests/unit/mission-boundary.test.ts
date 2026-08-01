import { describe, it, expect } from 'vitest';
import type { MissionContract } from '../../packages/semantiq/src/mission-boundary.js';
import { MissionBoundaryEvaluator } from '../../packages/semantiq/src/mission-boundary.js';
import type { BehavioralEventSchema } from '../../packages/semantiq/src/event-schema.js';
import type { PermissionGrant } from '../../packages/semantiq/src/environment-permissions.js';

describe('Mission Boundary and Containment Detection (Prompt 8.7)', () => {
  const mission: MissionContract = {
    missionId: 'mission_eval_01',
    objective: 'Evaluate synthetic test tasks safely',
    allowedVerbs: ['read', 'inspect', 'compare'],
    prohibitedVerbs: ['delete', 'deploy'],
    allowedResources: ['/tmp/scratch/'],
    prohibitedResources: ['/etc/passwd', 'https://api.external.com'],
    allowedTools: ['read_file', 'inspect_schema'],
    prohibitedTools: ['dangerous_shell_tool'],
    timeLimitMs: 60000,
    maxSteps: 5,
    dataBoundaries: ['local_only'],
    approvalCheckpoints: ['chk_deploy'],
    stopConditions: ['maxSteps_reached'],
    escalationConditions: ['http_403'],
    recoveryExpectations: ['roll_back']
  };

  const evaluator = new MissionBoundaryEvaluator();

  const baseEvent: BehavioralEventSchema = {
    eventId: 'evt_mb_01',
    schemaVersion: '1.0.0',
    runId: 'run_mb_100',
    actorId: 'agent_alpha',
    sequenceNumber: 1,
    timestamp: '2026-08-01T11:00:00Z',
    monotonicIndex: 1,
    eventType: 'ActionAttempted',
    primaryVerb: 'read',
    resourceRef: '/tmp/scratch/file.txt',
    toolRef: 'read_file',
    parentEventIds: [],
    causalType: 'direct',
    evidenceRefs: [],
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'none' },
    payload: {}
  };

  it('approves compliant action within mission boundaries', () => {
    const violation = evaluator.evaluateEvent(mission, baseEvent);
    expect(violation).toBeUndefined();
  });

  it('detects prohibited verb mission drift', () => {
    const prohibitedVerbEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: 'evt_mb_02',
      primaryVerb: 'delete'
    };
    const violation = evaluator.evaluateEvent(mission, prohibitedVerbEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe('mission_drift');
  });

  it('detects maxSteps failure to stop', () => {
    const stepExceededEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: 'evt_mb_03',
      sequenceNumber: 10
    };
    const violation = evaluator.evaluateEvent(mission, stepExceededEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe('failure_to_stop');
  });

  it('detects prohibited tool misuse', () => {
    const toolMisuseEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: 'evt_mb_04',
      toolRef: 'dangerous_shell_tool'
    };
    const violation = evaluator.evaluateEvent(mission, toolMisuseEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe('tool_misuse');
  });

  it('detects prohibited resource scope expansion (similar target names / wrong target)', () => {
    const scopeExpansionEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: 'evt_mb_05',
      resourceRef: '/etc/passwd'
    };
    const violation = evaluator.evaluateEvent(mission, scopeExpansionEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe('scope_expansion');
  });

  it('detects permission overreach on read-only resources', () => {
    const grant: PermissionGrant = {
      id: 'perm_read_only',
      resourceId: 'res_file',
      state: 'read_only',
      scope: { allowedPathsOrUrls: ['/tmp/scratch/'] },
      grantedAt: '2026-08-01T10:00:00Z',
      requiresHumanApproval: false
    };

    const overreachEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: 'evt_mb_06',
      primaryVerb: 'execute',
      permissionRef: 'perm_read_only'
    };

    const violation = evaluator.evaluateEvent(mission, overreachEvent, [grant]);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe('permission_overreach');
  });
});
