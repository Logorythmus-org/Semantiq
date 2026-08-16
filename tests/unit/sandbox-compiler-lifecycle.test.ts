import { describe, it, expect } from 'vitest';
import { EnvironmentCompiler } from '../../packages/environment-compiler/src/index.js';
import { LifecycleController } from '../../packages/lifecycle-engine/src/index.js';
import { DeterministicReplayAdapter } from '../../packages/adapter-replay/src/index.js';

describe('Sandbox Environment Compiler & Lifecycle Engine', () => {
  describe('EnvironmentCompiler', () => {
    it('compiles declarative benchmark task into sealed EnvironmentSpec', async () => {
      const compiler = new EnvironmentCompiler();
      const result = await compiler.compile({
        declarationVersion: '1.0.0',
        taskId: 'swe-bench-django-1234',
        taskDescription: 'Fix Django datetime formatting bug',
        baseProfile: {
          name: 'python_datascience',
          version: '3.11'
        },
        workspace: {
          workingDirectory: '/workspace',
          injectedFiles: [
            { path: '/workspace/fix.py', content: 'def fix(): pass' },
            { path: '/workspace/test_fix.py', content: 'def test(): assert True' }
          ]
        },
        resources: {
          cpuCores: 4,
          memoryMb: 4096,
          diskMb: 10240,
          timeoutSeconds: 120
        },
        security: {
          networkPolicy: 'none',
          readOnlyRoot: true
        }
      });

      expect(result.environmentSpec.image.digest).toMatch(/^sha256:/);
      expect(result.environmentSpec.resources.memoryLimitMebibytes).toBe(4096);
      expect(result.environmentSpec.initialFilesystem).toHaveLength(2);
      expect(result.specHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(result.initialRootMerkleHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('rejects invalid declarations without taskId', async () => {
      const compiler = new EnvironmentCompiler();
      await expect(
        compiler.compile({
          declarationVersion: '1.0.0',
          taskId: '',
          baseProfile: { name: 'python_datascience', version: '3.11' },
          workspace: {}
        })
      ).rejects.toThrowError(/Missing required taskId/);
    });
  });

  describe('LifecycleController', () => {
    it('progresses through canonical 8-stage lifecycle transitions', async () => {
      const adapter = new DeterministicReplayAdapter();
      const compiler = new EnvironmentCompiler();

      const { environmentSpec } = await compiler.compile({
        declarationVersion: '1.0.0',
        taskId: 'lifecycle-task-1',
        baseProfile: { name: 'python_datascience', version: '3.11' },
        workspace: {
          injectedFiles: [{ path: '/workspace/app.py', content: 'print(1)' }]
        }
      });

      const instance = await adapter.createSandbox(environmentSpec);
      const lifecycle = new LifecycleController(instance);

      const recordedTransitions: string[] = [];
      lifecycle.onTransition((event) => {
        recordedTransitions.push(`${event.fromState} -> ${event.toState}`);
      });

      // 1. Prepare
      await lifecycle.prepare();
      expect(lifecycle.currentState).toBe('READY');

      // 2. Execute
      const execResult = await lifecycle.execute({
        requestId: 'cmd-1',
        command: ['python', 'app.py'],
        timeoutMs: 5000
      });
      expect(execResult.exitCode).toBe(0);
      expect(lifecycle.currentState).toBe('READY');

      // 3. Snapshot
      const checkpoint = await lifecycle.snapshot('checkpoint_1');
      expect(checkpoint.checkpointId).toBeDefined();

      // 4. Collect
      const delta = await lifecycle.collect();
      expect(delta.mutations).toBeDefined();

      // 5. Restore
      await lifecycle.restore(checkpoint.checkpointId);
      expect(lifecycle.currentState).toBe('READY');

      // 6. Destroy
      const summary = await lifecycle.destroy();
      expect(lifecycle.currentState).toBe('DESTROYED');
      expect(summary.reclamationConfirmed).toBe(true);

      // Verify sequence
      expect(recordedTransitions).toContain('PREPARING -> READY');
      expect(recordedTransitions).toContain('READY -> EXECUTING');
      expect(recordedTransitions).toContain('EXECUTING -> OBSERVING');
      expect(recordedTransitions).toContain('OBSERVING -> COLLECTING');
      expect(recordedTransitions).toContain('COLLECTING -> READY');
      expect(recordedTransitions).toContain('READY -> SNAPSHOTTING');
      expect(recordedTransitions).toContain('SNAPSHOTTING -> READY');
      expect(recordedTransitions).toContain('READY -> RESTORING');
      expect(recordedTransitions).toContain('RESTORING -> READY');
      expect(recordedTransitions).toContain('READY -> DESTROYING');
      expect(recordedTransitions).toContain('DESTROYING -> DESTROYED');
    });
  });
});
