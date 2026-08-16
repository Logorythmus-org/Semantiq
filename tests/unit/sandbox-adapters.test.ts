import { describe, it, expect } from 'vitest';
import {
  type EnvironmentSpec
} from '../../packages/sandbox-contracts/src/index.js';
import { DeterministicReplayAdapter } from '../../packages/adapter-replay/src/index.js';
import { OciStreamDemuxer } from '../../packages/adapter-oci/src/index.js';
import { OpenSandboxAdapter } from '../../packages/adapter-opensandbox/src/index.js';
import {
  E2BCloudAdapter,
  CloudAuthenticationManager,
  CostQuotaGovernor
} from '../../packages/adapter-cloud-base/src/index.js';

describe('Sandbox Provider Adapters', () => {
  const testSpec: EnvironmentSpec = {
    specVersion: '1.0.0',
    runtimeType: 'container',
    image: { name: 'alpine', digest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    workingDirectory: '/workspace',
    resources: { cpuLimitCores: 1, memoryLimitMebibytes: 128, diskLimitMebibytes: 256, maxExecutionTimeoutSeconds: 60 },
    security: { networkMode: 'none', readOnlyRootFilesystem: true },
    initialFilesystem: [
      { path: '/workspace/main.py', contentBase64: Buffer.from('print("hello")').toString('base64'), sha256: 'abc' }
    ]
  };

  describe('DeterministicReplayAdapter', () => {
    it('creates sandbox, executes recorded commands, and terminates cleanly', async () => {
      const adapter = new DeterministicReplayAdapter([
        {
          command: ['python', 'main.py'],
          result: { stdout: 'hello\n', exitCode: 0, durationMs: 12 }
        }
      ]);

      const instance = await adapter.createSandbox(testSpec);
      expect(instance.instanceId).toContain('replay-');

      // Check initial file
      const fileData = await instance.readFile('/workspace/main.py');
      expect(Buffer.from(fileData).toString('utf-8')).toBe('print("hello")');

      // Execute command
      const res = await instance.executeCommand({
        requestId: 'req-1',
        command: ['python', 'main.py'],
        timeoutMs: 5000
      });
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe('hello\n');

      // Check state delta
      const delta = await instance.captureStateDelta();
      expect(delta.mutations.createdFiles).toHaveLength(1);

      // Checkpoint
      const checkpoint = await instance.createCheckpoint('cp1');
      expect(checkpoint.checkpointId).toBeDefined();

      // Terminate
      const summary = await instance.terminate();
      expect(summary.reclamationConfirmed).toBe(true);
      expect(summary.provenance.providerId).toBe('replay');
    });
  });

  describe('OCI 8-Byte Stream Demuxer', () => {
    it('demultiplexes interleaved stdout and stderr binary frames accurately', () => {
      const demuxer = new OciStreamDemuxer(1024);
      let stdout = '';
      let stderr = '';

      // Frame 1: stdout (type 1), size 5, payload "HELLO"
      const frame1 = Buffer.alloc(8 + 5);
      frame1[0] = 1;
      frame1.writeUInt32BE(5, 4);
      frame1.write('HELLO', 8);

      // Frame 2: stderr (type 2), size 4, payload "WARN"
      const frame2 = Buffer.alloc(8 + 4);
      frame2[0] = 2;
      frame2.writeUInt32BE(4, 4);
      frame2.write('WARN', 8);

      demuxer.processChunk(
        Buffer.concat([frame1, frame2]),
        (out) => { stdout += out; },
        (err) => { stderr += err; }
      );

      expect(stdout).toBe('HELLO');
      expect(stderr).toBe('WARN');
    });

    it('enforces stream size limits gracefully', () => {
      const demuxer = new OciStreamDemuxer(10); // 10 byte limit
      let stdout = '';

      const frame = Buffer.alloc(8 + 20);
      frame[0] = 1;
      frame.writeUInt32BE(20, 4);
      frame.write('01234567890123456789', 8);

      demuxer.processChunk(frame, (out) => { stdout += out; }, () => {});
      expect(stdout).toContain('[STREAM TRUNCATED: 5MB LIMIT EXCEEDED]');
    });
  });

  describe('OpenSandboxAdapter', () => {
    it('returns capabilities and handles health checks', async () => {
      const adapter = new OpenSandboxAdapter({ endpoint: 'http://localhost:9999' });
      const caps = await adapter.getCapabilities();
      expect(caps.supportsLiveStream).toBe(true);
      expect(caps.maxExecutionTimeoutSeconds).toBe(3600);

      const health = await adapter.healthCheck();
      expect(typeof health.isHealthy).toBe('boolean');
    });
  });

  describe('Cloud Base & E2B Adapter', () => {
    it('manages authentication and scrubs secrets from outputs', () => {
      const auth = new CloudAuthenticationManager();
      auth.configure({ apiKey: 'e2b_secret_token_12345678901234567890' });

      const scrubbed = auth.scrubSecrets('Error connecting with e2b_secret_token_12345678901234567890 to backend');
      expect(scrubbed).toBe('Error connecting with [REDACTED_CLOUD_SECRET] to backend');
    });

    it('governs cloud budget and auto-aborts on spend ceilings', () => {
      const governor = new CostQuotaGovernor({ maxSpendPerRunUsd: 0.05, maxConcurrentSandboxes: 2 });
      
      governor.checkPreflight();
      governor.onSandboxCreated();
      governor.onSandboxCreated();

      // Third sandbox should exceed concurrency
      expect(() => governor.checkPreflight()).toThrowError(/Active cloud sandboxes/);

      // Terminate one and register spend
      governor.onSandboxTerminated(60000, 0.06); // $0.06 spent, limit was $0.05

      // Subsequent preflight should fail on budget limit
      expect(() => governor.checkPreflight()).toThrowError(/reached budget ceiling/);
    });

    it('creates E2B sandbox, measures billing metadata and terminates', async () => {
      const adapter = new E2BCloudAdapter(
        { apiKey: 'e2b_test_key' },
        { maxSpendPerRunUsd: 1.0, maxConcurrentSandboxes: 5 }
      );

      const instance = await adapter.createSandbox(testSpec);
      expect(instance.instanceId).toContain('e2b-');

      const res = await instance.executeCommand({
        requestId: 'req-e2b-1',
        command: ['echo', 'cloud'],
        timeoutMs: 5000
      });
      expect(res.stdout).toContain('[E2B MicroVM]');

      const summary = await instance.terminate();
      expect(summary.reclamationConfirmed).toBe(true);
    });
  });
});
