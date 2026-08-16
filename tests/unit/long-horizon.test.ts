import { describe, it, expect } from 'vitest';
import {
  LongHorizonTestingEngine,
  type LongHorizonScenarioSpec,
  type BehavioralTraceEvent
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Long-Horizon Agent Testing Architecture', () => {
  const engine = new LongHorizonTestingEngine();

  const sampleSpec: LongHorizonScenarioSpec = {
    scenarioId: 'scenario-fullstack-crm-build',
    displayName: 'Fullstack Microservices CRM Build & Deploy',
    totalHorizonSteps: 100,
    allowedTools: ['bash', 'file_editor', 'docker', 'pytest'],
    tokenBudgetLimit: 50000,
    wallClockTimeoutSeconds: 3600,
    milestones: [
      {
        milestoneId: 'ms-01-recon',
        phase: 'DISCOVERY_AND_RECON',
        description: 'Inspect requirements and existing database schema',
        targetArtifacts: ['schema.sql'],
        validationCriteria: { schemaInspected: true },
        maxStepBudget: 10
      },
      {
        milestoneId: 'ms-02-arch',
        phase: 'ARCHITECTURAL_PLANNING',
        description: 'Create architectural design and OpenAPI spec',
        targetArtifacts: ['openapi.yaml', 'ARCHITECTURE.md'],
        validationCriteria: { specValid: true },
        maxStepBudget: 15
      },
      {
        milestoneId: 'ms-03-scaffold',
        phase: 'SCAFFOLD_AND_BOOTSTRAP',
        description: 'Initialize project structure and Dockerfile',
        targetArtifacts: ['package.json', 'Dockerfile'],
        validationCriteria: { buildPasses: true },
        maxStepBudget: 20
      },
      {
        milestoneId: 'ms-04-impl',
        phase: 'INCREMENTAL_IMPLEMENTATION',
        description: 'Implement API routes and auth middleware',
        targetArtifacts: ['src/routes.ts', 'src/auth.ts'],
        validationCriteria: { routesImplemented: true },
        maxStepBudget: 30
      },
      {
        milestoneId: 'ms-05-test',
        phase: 'INTEGRATION_AND_TESTING',
        description: 'Run integration test suite and fix failing tests',
        targetArtifacts: ['tests/integration.test.ts'],
        validationCriteria: { allTestsPass: true },
        maxStepBudget: 15
      },
      {
        milestoneId: 'ms-06-verify',
        phase: 'VERIFICATION_AND_FINALIZE',
        description: 'Run end-to-end sanity verification and output receipt',
        targetArtifacts: ['README.md'],
        validationCriteria: { verified: true },
        maxStepBudget: 10
      }
    ]
  };

  it('plans long-horizon scenario and verifies total step budgets', () => {
    const plan = engine.planScenario(sampleSpec);

    expect(plan.isValid).toBe(true);
    expect(plan.totalStepBudget).toBe(100);
  });

  it('evaluates successful long-horizon trajectory and awards GRADE_LH1_AUTONOMOUS_SCALE', () => {
    const traceEvents: BehavioralTraceEvent[] = [
      // MS 1: Discovery (steps 0-4)
      {
        eventId: 'evt-0',
        seq: 0,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:00Z',
        agentId: 'agent-scale-01',
        actionType: 'READ_FILE',
        payload: { file: 'schema.sql' },
        payloadDigest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
      },
      {
        eventId: 'evt-1',
        seq: 1,
        stage: 'RESULT',
        timestamp: '2026-08-15T12:00:01Z',
        agentId: 'agent-scale-01',
        payload: { exitCode: 0, passed: true },
        payloadDigest: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
      },
      // MS 2: Architectural Planning (steps 10-15)
      {
        eventId: 'evt-10',
        seq: 10,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:10Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'openapi.yaml', text: 'openapi: 3.0.0' },
        payloadDigest: 'sha256:2222222222222222222222222222222222222222222222222222222222222222'
      },
      {
        eventId: 'evt-11',
        seq: 11,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:11Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'ARCHITECTURE.md', text: '# Architecture' },
        payloadDigest: 'sha256:3333333333333333333333333333333333333333333333333333333333333333'
      },
      // MS 3: Scaffold (steps 25-30)
      {
        eventId: 'evt-25',
        seq: 25,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:25Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'package.json' },
        payloadDigest: 'sha256:4444444444444444444444444444444444444444444444444444444444444444'
      },
      {
        eventId: 'evt-26',
        seq: 26,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:26Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'Dockerfile' },
        payloadDigest: 'sha256:5555555555555555555555555555555555555555555555555555555555555555'
      },
      // MS 4: Implementation (steps 45-50)
      {
        eventId: 'evt-45',
        seq: 45,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:45Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'src/routes.ts' },
        payloadDigest: 'sha256:6666666666666666666666666666666666666666666666666666666666666666'
      },
      {
        eventId: 'evt-46',
        seq: 46,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:46Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'src/auth.ts' },
        payloadDigest: 'sha256:7777777777777777777777777777777777777777777777777777777777777777'
      },
      // MS 5: Testing (steps 75-80)
      {
        eventId: 'evt-75',
        seq: 75,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:75Z',
        agentId: 'agent-scale-01',
        actionType: 'EXECUTE_COMMAND',
        payload: { cmd: 'pytest tests/integration.test.ts' },
        payloadDigest: 'sha256:8888888888888888888888888888888888888888888888888888888888888888'
      },
      {
        eventId: 'evt-76',
        seq: 76,
        stage: 'RESULT',
        timestamp: '2026-08-15T12:00:76Z',
        agentId: 'agent-scale-01',
        payload: { exitCode: 0, passed: true },
        payloadDigest: 'sha256:9999999999999999999999999999999999999999999999999999999999999999'
      },
      // MS 6: Verification (steps 90-95)
      {
        eventId: 'evt-90',
        seq: 90,
        stage: 'ACTION',
        timestamp: '2026-08-15T12:00:90Z',
        agentId: 'agent-scale-01',
        actionType: 'WRITE_FILE',
        payload: { file: 'README.md' },
        payloadDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      },
      {
        eventId: 'evt-91',
        seq: 91,
        stage: 'RESULT',
        timestamp: '2026-08-15T12:00:91Z',
        agentId: 'agent-scale-01',
        payload: { exitCode: 0, passed: true },
        payloadDigest: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      }
    ];

    const report = engine.evaluateLongHorizonTrajectory(sampleSpec, 'agent-scale-01', traceEvents);

    expect(report.totalMilestonesCount).toBe(6);
    expect(report.completedMilestonesCount).toBe(6);
    expect(report.milestoneCompletionRate).toBe(1.0);
    expect(report.longHorizonResilienceIndex).toBeGreaterThanOrEqual(0.85);
    expect(report.horizonGrade).toBe('GRADE_LH1_AUTONOMOUS_SCALE');
    expect(report.reportSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('penalizes abandoned or early collapsing trajectories with GRADE_LH4_HORIZON_COLLAPSED', () => {
    const report = engine.evaluateLongHorizonTrajectory(sampleSpec, 'agent-fragile', []);

    expect(report.completedMilestonesCount).toBe(0);
    expect(report.milestoneCompletionRate).toBe(0.0);
    expect(report.horizonGrade).toBe('GRADE_LH4_HORIZON_COLLAPSED');
  });

  it('exports formatted Markdown long-horizon evaluation scorecard', () => {
    const report = engine.evaluateLongHorizonTrajectory(sampleSpec, 'agent-scale-01', []);
    const markdown = engine.exportReportMarkdown(report);

    expect(markdown).toContain('# Long-Horizon Agent Evaluation Report');
    expect(markdown).toContain('Long-Horizon Resilience Index (LHRI)');
    expect(markdown).toContain('Multi-Phase Milestone Breakdown');
    expect(markdown).toContain('Cryptographic Report Signature');
  });
});
