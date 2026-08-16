import { describe, it, expect } from 'vitest';
import {
  CLIRunnerEngine,
  type SandboxBenchmarkDSL
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — CLI & Local Runner Architecture', () => {
  const runner = new CLIRunnerEngine();

  const sampleDSL: SandboxBenchmarkDSL = {
    dslVersion: '1.0.0',
    metadata: {
      benchmarkId: 'semantiq-local-bench-v1',
      scenarioId: 'scenario-local-test-01',
      version: '1.0.0',
      title: 'Local Unit Refactor Scenario',
      description: 'Quick local test of CLI runner pipeline',
      tags: ['local', 'fast'],
      license: 'MIT',
      author: 'Local Developer'
    },
    environment: {
      runtimeType: 'container',
      baseImage: 'python:3.11-slim',
      resources: {
        cpuCores: 1,
        memoryMb: 1024,
        diskGb: 2
      },
      networkPolicy: 'ISOLATED'
    },
    actors: [
      {
        actorId: 'local-agent',
        role: 'PRIMARY_AGENT',
        allowedTools: ['bash_tool'],
        permissionLevel: 'SANDBOX_USER'
      }
    ],
    tools: [
      {
        name: 'bash_tool',
        type: 'BASH',
        description: 'Bash tool',
        timeoutMs: 5000
      }
    ],
    assertions: [
      {
        assertionId: 'assert-exit',
        type: 'EXIT_CODE_EQUALS',
        params: { expectedCode: 0 },
        weight: 1.0
      }
    ],
    lifecycle: {
      setupCommands: ['echo "Init"'],
      maxDurationSeconds: 60,
      totalStepBudget: 10,
      retryBudget: 1,
      teardownCommands: []
    }
  };

  it('detects available local container and virtualization runtimes', () => {
    const providers = runner.detectLocalProviders();

    expect(providers.length).toBeGreaterThan(0);
    expect(providers.some(p => p.providerType === 'docker')).toBe(true);
    expect(providers.some(p => p.providerType === 'podman')).toBe(true);
  });

  it('resolves provider preference and automatic selection', () => {
    expect(runner.resolveProvider('docker')).toBe('provider-docker-local');
    expect(runner.resolveProvider('podman')).toBe('provider-podman-local');
    expect(runner.resolveProvider('auto')).toMatch(/^provider-(docker|podman|local_process)-local$/);
  });

  it('executes dry-run validation without sandbox provisioning', async () => {
    const result = await runner.run({
      manifestPath: 'scenario.yaml',
      dslDocument: sampleDSL,
      providerPreference: 'auto',
      outputDir: './results',
      dryRun: true
    });

    expect(result.exitCode).toBe(0);
    expect(result.runId).toMatch(/^dry-run-/);
    expect(result.scorecardSummary.resilienceGrade).toBe('DRY_RUN_VALIDATED');
  });

  it('executes full local benchmark run and formats terminal summary', async () => {
    const result = await runner.run({
      manifestPath: 'scenario.yaml',
      dslDocument: sampleDSL,
      providerPreference: 'docker',
      outputDir: './results'
    });

    expect(result.exitCode).toBe(0);
    expect(result.scenarioId).toBe('scenario-local-test-01');
    expect(result.artifactsGenerated.length).toBe(4);
    expect(result.manifestDigest).toMatch(/^[a-f0-9]{64}$/);

    const terminalOutput = runner.formatTerminalOutput(result);
    expect(terminalOutput).toContain('SemantIQ Benchmark Local Runner');
    expect(terminalOutput).toContain('scenario-local-test-01');
    expect(terminalOutput).toContain('PASSED ✅');
    expect(terminalOutput).toContain('manifest.json');
  });
});
