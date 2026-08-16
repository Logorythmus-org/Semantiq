import { describe, it, expect } from 'vitest';
import {
  SandboxBenchmarkCompiler,
  type SandboxBenchmarkDSL
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Sandbox Benchmark DSL Architecture', () => {
  const compiler = new SandboxBenchmarkCompiler();

  const sampleDSL: SandboxBenchmarkDSL = {
    dslVersion: '1.0.0',
    metadata: {
      benchmarkId: 'semantiq-code-refactor-v1',
      scenarioId: 'scenario-async-migrator-01',
      version: '1.2.0',
      title: 'Async I/O Migration and Distributed Concurrency Refactor',
      description: 'Migrate synchronous Flask web application to FastAPI with async motor MongoDB driver.',
      tags: ['python', 'fastapi', 'async', 'refactor', 'stress'],
      license: 'Apache-2.0',
      author: 'SemantIQ Architecture Guild'
    },
    environment: {
      runtimeType: 'container',
      baseImage: 'python:3.11-slim',
      resources: {
        cpuCores: 2,
        memoryMb: 4096,
        diskGb: 10
      },
      networkPolicy: 'EGRESS_ALLOWLIST',
      egressAllowlist: ['pypi.org', 'files.pythonhosted.org'],
      envVars: {
        PYTHONPATH: '/workspace',
        ENVIRONMENT: 'test'
      },
      preinstalledPackages: ['pytest', 'httpx', 'motor']
    },
    actors: [
      {
        actorId: 'primary-agent',
        role: 'PRIMARY_AGENT',
        allowedTools: ['bash_tool', 'file_editor', 'test_runner'],
        permissionLevel: 'SANDBOX_USER'
      }
    ],
    tools: [
      {
        name: 'bash_tool',
        type: 'BASH',
        description: 'Execute shell commands inside sandbox container',
        timeoutMs: 30000
      },
      {
        name: 'file_editor',
        type: 'FILE_SYSTEM',
        description: 'Read and edit source code files',
        timeoutMs: 5000
      },
      {
        name: 'test_runner',
        type: 'BASH',
        description: 'Execute pytest suite',
        timeoutMs: 60000
      }
    ],
    perturbations: [
      {
        perturbationId: 'pert-01',
        mode: 'NETWORK_PARTITION_LATENCY',
        triggerStep: 5,
        parameters: { latencyMs: 200 }
      }
    ],
    milestones: [
      {
        milestoneId: 'ms-01',
        phase: 'DISCOVERY_AND_RECON',
        description: 'Audit synchronous blocking endpoints',
        stepBudget: 10,
        requiredArtifacts: ['AUDIT.md']
      },
      {
        milestoneId: 'ms-02',
        phase: 'INCREMENTAL_IMPLEMENTATION',
        description: 'Convert routes to async def and update motor queries',
        stepBudget: 25,
        requiredArtifacts: ['app/main.py']
      },
      {
        milestoneId: 'ms-03',
        phase: 'INTEGRATION_AND_TESTING',
        description: 'Run async pytest suite and verify 100% pass',
        stepBudget: 15,
        requiredArtifacts: ['tests/test_async.py']
      }
    ],
    assertions: [
      {
        assertionId: 'assert-test-pass',
        type: 'TEST_SUITE_PASSES',
        params: { suitePath: 'tests/test_async.py' },
        weight: 0.7
      },
      {
        assertionId: 'assert-rri',
        type: 'RRI_THRESHOLD',
        params: { minRRI: 0.8 },
        weight: 0.3
      }
    ],
    lifecycle: {
      setupCommands: ['pip install -r requirements.txt', 'python init_db.py'],
      maxDurationSeconds: 1800,
      totalStepBudget: 50,
      retryBudget: 2,
      teardownCommands: ['rm -rf /tmp/*']
    },
    extensions: {
      docker: {
        cgroupParent: 'semantiq-benchmarks',
        securityOpt: ['no-new-privileges:true']
      }
    }
  };

  it('validates a well-formed Sandbox Benchmark DSL document', () => {
    const result = compiler.validate(sampleDSL);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('compiles DSL into provider-neutral execution contract and calculates canonical digest', () => {
    const compiled = compiler.compile(sampleDSL);

    expect(compiled.scenarioId).toBe('scenario-async-migrator-01');
    expect(compiled.environmentSpec.runtimeType).toBe('container');
    expect(compiled.environmentSpec.image.name).toBe('python:3.11-slim');
    expect(compiled.environmentSpec.resources.cpuLimitCores).toBe(2);
    expect(compiled.executionRequest.timeoutMs).toBe(1800000);
    expect(compiled.canonicalDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detects and reports validation errors for undeclared tools and budget overflow', () => {
    const invalidDSL: SandboxBenchmarkDSL = {
      ...sampleDSL,
      actors: [
        {
          actorId: 'rogue-agent',
          role: 'PRIMARY_AGENT',
          allowedTools: ['undeclared_tool_xyz'],
          permissionLevel: 'SANDBOX_USER'
        }
      ],
      milestones: [
        {
          milestoneId: 'ms-huge',
          phase: 'INCREMENTAL_IMPLEMENTATION',
          description: 'Huge milestone',
          stepBudget: 100, // exceeds totalStepBudget 50
          requiredArtifacts: []
        }
      ]
    };

    const result = compiler.validate(invalidDSL);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('undeclared tool'))).toBe(true);
    expect(result.errors.some(e => e.includes('exceed totalStepBudget'))).toBe(true);
    expect(() => compiler.compile(invalidDSL)).toThrow('DSL Compilation Failed');
  });
});
