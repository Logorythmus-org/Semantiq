/**
 * @package @tech-club/sandbox-tck
 * Automated Sandbox Technology Compatibility Kit (TCK)
 */

import type {
  ISandboxProvider,
  EnvironmentSpec
} from '../../sandbox-contracts/src/index.js';

export interface TckReport {
  readonly providerId: string;
  readonly passed: boolean;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly results: readonly { readonly testName: string; readonly passed: boolean; readonly error?: string }[];
}

export class SandboxTCK {
  async runSuite(provider: ISandboxProvider): Promise<TckReport> {
    const results: { testName: string; passed: boolean; error?: string }[] = [];

    const defaultSpec: EnvironmentSpec = {
      specVersion: '1.0.0',
      runtimeType: 'container',
      image: { name: 'alpine', digest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      workingDirectory: '/workspace',
      resources: { cpuLimitCores: 1, memoryLimitMebibytes: 128, diskLimitMebibytes: 256, maxExecutionTimeoutSeconds: 30 },
      security: { networkMode: 'none', readOnlyRootFilesystem: true }
    };

    // Test 1: Capabilities Introspection
    try {
      const caps = await provider.getCapabilities();
      if (!caps.supportedArchitectures || caps.supportedArchitectures.length === 0) {
        throw new Error('Capabilities missing supported architectures');
      }
      results.push({ testName: 'CapabilitiesIntrospection', passed: true });
    } catch (err: any) {
      results.push({ testName: 'CapabilitiesIntrospection', passed: false, error: err.message });
    }

    // Test 2: Health Check
    try {
      const health = await provider.healthCheck();
      if (typeof health.isHealthy !== 'boolean') {
        throw new Error('Health check returned invalid response');
      }
      results.push({ testName: 'HealthCheck', passed: true });
    } catch (err: any) {
      results.push({ testName: 'HealthCheck', passed: false, error: err.message });
    }

    // Test 3: Spec Validation
    try {
      const val = await provider.validateEnvironmentSpec(defaultSpec);
      if (!val.isValid) {
        throw new Error(`Valid spec was rejected: ${val.errors.join(', ')}`);
      }
      results.push({ testName: 'SpecValidation', passed: true });
    } catch (err: any) {
      results.push({ testName: 'SpecValidation', passed: false, error: err.message });
    }

    // Test 4: Lifecycle Execution & Teardown
    try {
      const instance = await provider.createSandbox(defaultSpec);
      
      let stdoutReceived = '';
      await instance.attachObserver({
        onStdout: (e) => { stdoutReceived += e.text; },
        onStderr: () => {}
      });

      const execResult = await instance.executeCommand({
        requestId: 'tck-cmd-1',
        command: ['echo', 'TCK_PROBE'],
        timeoutMs: 5000
      });

      if (execResult.exitCode !== 0) {
        throw new Error(`Execution returned non-zero exit code: ${execResult.exitCode}`);
      }

      const delta = await instance.captureStateDelta();
      if (!delta || !delta.mutations) {
        throw new Error('State delta returned invalid structure');
      }

      const summary = await instance.terminate();
      if (!summary.reclamationConfirmed) {
        throw new Error('Reclamation was not confirmed in termination summary');
      }

      results.push({ testName: 'LifecycleExecutionAndTeardown', passed: true });
    } catch (err: any) {
      results.push({ testName: 'LifecycleExecutionAndTeardown', passed: false, error: err.message });
    }

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      providerId: provider.providerId,
      passed: failedCount === 0,
      totalTests: results.length,
      passedTests: passedCount,
      failedTests: failedCount,
      results
    };
  }
}
