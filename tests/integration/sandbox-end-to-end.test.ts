import { describe, it, expect } from 'vitest';
import {
  EnvironmentCompiler,
  CapabilityDiscoveryService,
  ProviderSelectionRouter,
  LifecycleController,
  EvidenceNormalizer,
  DeterministicReplayAdapter,
  LocalSemantiqEngine,
  type ScoringProfile,
  type BenchmarkSubject
} from '../../packages/semantiq/src/index.js';

describe('SemantIQ Sandbox Phase — End-to-End Execution Pipeline', () => {
  it('executes end-to-end flow from benchmark task to normalized evaluation report', async () => {
    // 1. Declare Benchmark Task
    const compiler = new EnvironmentCompiler();
    const compilation = await compiler.compile({
      declarationVersion: '1.0.0',
      taskId: 'task-e2e-benchmark-01',
      taskDescription: 'Evaluate agent code generation and test execution',
      baseProfile: {
        name: 'python_datascience',
        version: '3.11'
      },
      workspace: {
        workingDirectory: '/workspace',
        injectedFiles: [
          { path: '/workspace/solution.py', content: 'def solve(): return 42' },
          { path: '/workspace/test_solution.py', content: 'from solution import solve\ndef test_solve(): assert solve() == 42' }
        ]
      },
      resources: { cpuCores: 2, memoryMb: 1024, diskMb: 2048, timeoutSeconds: 60 },
      security: { networkPolicy: 'none', readOnlyRoot: true }
    });

    expect(compilation.specHash).toBeDefined();

    // 2. Discover Capabilities & Register Providers
    const discovery = new CapabilityDiscoveryService();
    const replayAdapter = new DeterministicReplayAdapter([
      {
        command: ['pytest', 'test_solution.py'],
        result: {
          stdout: '\u001b[32m==== 1 passed in 0.05s ====\u001b[0m\nToken: sk-123456789012345678901234567890123456789012345678',
          stderr: '',
          exitCode: 0,
          durationMs: 50
        }
      }
    ]);
    const manifest = await discovery.registerProvider(replayAdapter);

    // 3. Route Task
    const router = new ProviderSelectionRouter();
    router.registerProvider(replayAdapter, manifest, 100);

    const routingDecision = await router.evaluateRoute(compilation.environmentSpec, {
      classification: 'TRUSTED_LOCAL',
      requiredIsolationTier: 'ROOTLESS_OCI',
      allowInternetAccess: false
    });
    expect(routingDecision.selectedProviderId).toBe('replay');

    // 4. Instantiate & Run Lifecycle
    const instance = await router.createRoutedSandbox(compilation.environmentSpec, {
      classification: 'TRUSTED_LOCAL',
      requiredIsolationTier: 'ROOTLESS_OCI',
      allowInternetAccess: false
    });
    const lifecycle = new LifecycleController(instance);

    await lifecycle.prepare();
    expect(lifecycle.currentState).toBe('READY');

    const execResult = await lifecycle.execute({
      requestId: 'e2e-exec-1',
      command: ['pytest', 'test_solution.py'],
      timeoutMs: 10000
    });
    expect(execResult.exitCode).toBe(0);

    const delta = await lifecycle.collect();
    const termination = await lifecycle.destroy();
    expect(termination.reclamationConfirmed).toBe(true);

    // 5. Evidence Normalization
    const normalizer = new EvidenceNormalizer();
    const evidence = await normalizer.normalize({
      spec: compilation.environmentSpec,
      request: { requestId: 'e2e-exec-1', command: ['pytest', 'test_solution.py'], timeoutMs: 10000 },
      result: execResult,
      delta,
      agentReasoningTrace: 'Ran pytest on test_solution.py to verify solution correctness.',
      providerId: routingDecision.selectedProviderId,
      providerVersion: '1.0.0'
    });

    expect(evidence.result.stdoutSanitized).toContain('==== 1 passed in 0.05s ====');
    expect(evidence.result.stdoutSanitized).toContain('[REDACTED_SECRET]');
    expect(evidence.evidenceDigest).toMatch(/^sha256:/);

    // 6. Semantic Evaluation by SemantIQ Engine
    const engine = new LocalSemantiqEngine();
    const profile: ScoringProfile = {
      id: 'profile-code-quality-v1',
      name: 'Code Quality Evaluation Profile',
      version: '1.0.0',
      weights: {
        'question-quality': 1.0,
        'reasoning-quality': 1.5,
        'evidence-quality': 2.0,
        'semantic-consistency': 1.0
      }
    };

    const subject: BenchmarkSubject = {
      id: evidence.evidenceId,
      kind: 'question',
      version: '1.0.0',
      content: evidence,
      evidenceIds: [evidence.evidenceDigest],
      contextIds: []
    };

    const report = await engine.evaluate(subject, profile);
    expect(report.id).toBeDefined();
    expect(report.weightedScore).toBeGreaterThan(0);
    expect(report.scores.length).toBeGreaterThan(0);
  });
});
