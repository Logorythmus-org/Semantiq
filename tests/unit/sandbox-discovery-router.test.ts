import { describe, it, expect } from 'vitest';
import {
  type EnvironmentSpec
} from '../../packages/sandbox-contracts/src/index.js';
import { DeterministicReplayAdapter } from '../../packages/adapter-replay/src/index.js';
import { E2BCloudAdapter } from '../../packages/adapter-cloud-base/src/index.js';
import { CapabilityDiscoveryService } from '../../packages/capability-discovery/src/index.js';
import { ProviderSelectionRouter } from '../../packages/sandbox-router/src/index.js';

describe('Sandbox Capability Discovery & Dynamic Router', () => {
  const sampleSpec: EnvironmentSpec = {
    specVersion: '1.0.0',
    runtimeType: 'container',
    image: { name: 'python:3.11', digest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    workingDirectory: '/workspace',
    resources: { cpuLimitCores: 2, memoryLimitMebibytes: 2048, diskLimitMebibytes: 5120, maxExecutionTimeoutSeconds: 60 },
    security: { networkMode: 'none', readOnlyRootFilesystem: true }
  };

  it('probes provider capabilities and registers manifest', async () => {
    const discovery = new CapabilityDiscoveryService();
    const replay = new DeterministicReplayAdapter();

    const manifest = await discovery.registerProvider(replay);
    expect(manifest.providerId).toBe('replay');
    expect(manifest.compute.maxMemoryMb).toBeGreaterThan(1000);
    expect(manifest.browserAutomation.supported).toBe(true);

    const retrieved = discovery.getManifest('replay');
    expect(retrieved).toBeDefined();
    expect(retrieved?.manifestVersion).toBe('1.0.0');
  });

  it('negotiates capabilities and plans software fallbacks', async () => {
    const discovery = new CapabilityDiscoveryService();
    await discovery.registerProvider(new DeterministicReplayAdapter());

    const result = discovery.negotiate(sampleSpec);
    expect(result.isCompatible).toBe(true);
    expect(result.selectedProviderId).toBe('replay');
    expect(result.missingMandatoryFeatures).toHaveLength(0);
  });

  it('routes tasks according to trust tiers and constraints', async () => {
    const discovery = new CapabilityDiscoveryService();
    const router = new ProviderSelectionRouter();

    const replayAdapter = new DeterministicReplayAdapter();
    const replayManifest = await discovery.registerProvider(replayAdapter);

    const cloudAdapter = new E2BCloudAdapter({ apiKey: 'test_key' });
    const cloudManifest = await discovery.registerProvider(cloudAdapter);

    router.registerProvider(replayAdapter, replayManifest, 100);
    router.registerProvider(cloudAdapter, cloudManifest, 50);

    // Route trusted local task
    const localDecision = await router.evaluateRoute(sampleSpec, {
      classification: 'TRUSTED_LOCAL',
      requiredIsolationTier: 'ROOTLESS_OCI',
      allowInternetAccess: false
    });
    expect(localDecision.selectedProviderId).toBe('replay');
    expect(localDecision.failoverChain.length).toBeGreaterThan(0);

    // Route adversarial eval task (requires MicroVM)
    const microVmDecision = await router.evaluateRoute(sampleSpec, {
      classification: 'ADVERSARIAL_EVAL',
      requiredIsolationTier: 'HARDWARE_MICROVM',
      allowInternetAccess: false
    });
    expect(microVmDecision.selectedProviderId).toBe('e2b');
  });

  it('creates routed sandbox and executes seamlessly', async () => {
    const discovery = new CapabilityDiscoveryService();
    const router = new ProviderSelectionRouter();

    const replay = new DeterministicReplayAdapter();
    const manifest = await discovery.registerProvider(replay);
    router.registerProvider(replay, manifest, 100);

    const sandbox = await router.createRoutedSandbox(sampleSpec, {
      classification: 'TRUSTED_LOCAL',
      requiredIsolationTier: 'ROOTLESS_OCI',
      allowInternetAccess: false
    });

    const res = await sandbox.executeCommand({
      requestId: 'r-1',
      command: ['echo', 'routed'],
      timeoutMs: 5000
    });

    expect(res.exitCode).toBe(0);
    await sandbox.terminate();
  });
});
