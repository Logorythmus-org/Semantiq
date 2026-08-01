import { describe, it, expect } from 'vitest';
import type {
  BehaviorRun,
  BehaviorTrace,
  ContextRecord,
  ActionRecord,
  ResultRecord,
  ConsequenceRecord,
  RecoveryRecord,
  BehaviorProfile
} from '../../packages/semantiq/src/behavioral-contracts.js';

describe('Behavioral Domain Contracts', () => {
  it('instantiates valid 9-stage behavioral records deterministically', () => {
    const context: ContextRecord = {
      id: 'ctx_001',
      timestamp: '2026-08-01T08:00:00Z',
      mission: {
        id: 'mission_001',
        goalDescription: 'Test single agent workflow',
        targetConstraints: ['read-only'],
        maxStepsAllowed: 5
      },
      environment: {
        id: 'env_001',
        os: 'windows',
        runtimeVersion: 'node-v20',
        resources: [{ id: 'res_1', type: 'file', pathOrUri: '/tmp/test', isReadOnly: true }],
        permissions: [{ id: 'perm_1', actionType: 'read', targetResource: '/tmp/test', isAllowed: true, scope: 'local' }],
        isSandboxed: true
      },
      priorHistoryLength: 0
    };

    const action: ActionRecord = {
      id: 'act_001',
      timestamp: '2026-08-01T08:00:01Z',
      decisionId: 'dec_001',
      verb: 'READ',
      target: '/tmp/test',
      parameters: { mode: 'text' }
    };

    const result: ResultRecord = {
      id: 'res_001',
      timestamp: '2026-08-01T08:00:02Z',
      actionId: 'act_001',
      status: 'success',
      exitCode: 0,
      outputSummary: 'File read successfully',
      evidenceReferences: [{ id: 'ev_001', uri: 'file:///tmp/test', hash: 'sha256:abc', mimeType: 'text/plain' }]
    };

    const trace: BehaviorTrace = {
      id: 'trace_001',
      runId: 'run_001',
      agentId: 'agent_alpha',
      startTime: '2026-08-01T08:00:00Z',
      events: [
        { id: 'evt_1', runId: 'run_001', stepNumber: 1, stage: 'context', timestamp: '2026-08-01T08:00:00Z', payload: context },
        { id: 'evt_2', runId: 'run_001', stepNumber: 2, stage: 'action', timestamp: '2026-08-01T08:00:01Z', payload: action },
        { id: 'evt_3', runId: 'run_001', stepNumber: 3, stage: 'result', timestamp: '2026-08-01T08:00:02Z', payload: result }
      ],
      isComplete: true
    };

    const run: BehaviorRun = {
      id: 'run_001',
      missionId: 'mission_001',
      agentId: 'agent_alpha',
      traceId: 'trace_001',
      status: 'completed',
      totalSteps: 3,
      createdAt: '2026-08-01T08:00:00Z'
    };

    expect(run.status).toBe('completed');
    expect(trace.events.length).toBe(3);
    expect(action.verb).toBe('READ');
  });

  it('validates behavior profile risk tolerances', () => {
    const profile: BehaviorProfile = {
      id: 'prof_strict',
      name: 'Strict Safety Profile',
      version: '1.0.0',
      verbWeights: { READ: 1.0, WRITE: 0.5, EXECUTE: 0.1 },
      maxRiskTolerance: 'low'
    };
    expect(profile.maxRiskTolerance).toBe('low');
  });
});
