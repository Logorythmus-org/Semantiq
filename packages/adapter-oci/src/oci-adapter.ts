/**
 * @package @tech-club/adapter-oci
 * Local OCI / Docker Adapter Implementation
 */

import {
  BaseSandboxAdapter,
  type EnvironmentSpec,
  type SandboxCapabilities,
  type ProviderHealthStatus,
  type ISandboxInstance
} from '../../sandbox-contracts/src/index.js';
import { DockerEngineHttpClient, type DockerClientConfig } from './docker-client.js';
import { LocalOciInstance } from './oci-instance.js';

export class LocalOciAdapter extends BaseSandboxAdapter {
  readonly providerId = 'local-oci';
  readonly providerVersion = '1.0.0';

  private readonly client: DockerEngineHttpClient;

  constructor(config?: DockerClientConfig) {
    super();
    this.client = new DockerEngineHttpClient(config);
  }

  async getCapabilities(): Promise<SandboxCapabilities> {
    return {
      supportsSnapshots: true,
      supportsFilesystemDiff: true,
      supportsLiveStream: true,
      supportsMicroVM: false,
      supportsNetworkPolicy: true,
      supportsResourceHardening: true,
      maxExecutionTimeoutSeconds: 3600,
      supportedArchitectures: [process.arch === 'arm64' ? 'aarch64' : 'x86_64']
    };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    try {
      const ping = await this.client.request<string>('GET', '/_ping');
      return {
        providerId: this.providerId,
        isHealthy: ping === 'OK',
        latencyMs: 1,
        details: { socket: 'connected' }
      };
    } catch (err: any) {
      return {
        providerId: this.providerId,
        isHealthy: false,
        latencyMs: -1,
        details: { error: err.message }
      };
    }
  }

  async createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance> {
    const validation = await this.validateEnvironmentSpec(spec);
    if (!validation.isValid) {
      throw new Error(`EnvironmentSpec validation failed: ${validation.errors.join(', ')}`);
    }

    const imageRef = spec.image.digest ? `${spec.image.name}@${spec.image.digest}` : spec.image.name;
    const instanceId = `semantiq-oci-${crypto.randomUUID()}`;

    const createPayload = {
      Image: imageRef,
      WorkingDir: spec.workingDirectory || '/workspace',
      Env: Object.entries(spec.environmentVariables || {}).map(([k, v]) => `${k}=${v}`),
      Labels: {
        'semantiq.managed': 'true',
        'semantiq.instance_id': instanceId,
        'semantiq.created_at': new Date().toISOString()
      },
      HostConfig: {
        NetworkMode: spec.security.networkMode === 'none' ? 'none' : 'bridge',
        ReadonlyRootfs: spec.security.readOnlyRootFilesystem,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges:true'],
        Memory: spec.resources.memoryLimitMebibytes * 1024 * 1024,
        MemorySwap: spec.resources.memoryLimitMebibytes * 1024 * 1024,
        NanoCPUs: Math.floor(spec.resources.cpuLimitCores * 1e9),
        PidsLimit: spec.resources.maxProcessCount || 128,
        Tmpfs: {
          '/workspace': 'rw,exec,size=512m',
          '/tmp': 'rw,exec,size=256m'
        }
      }
    };

    const res = await this.client.request<{ Id: string }>('POST', `/containers/create?name=${instanceId}`, createPayload);
    await this.client.request('POST', `/containers/${res.Id}/start`);

    const instance = new LocalOciInstance(res.Id, instanceId, this.client, spec, this.providerVersion);

    // Initial files
    if (spec.initialFilesystem && spec.initialFilesystem.length > 0) {
      for (const file of spec.initialFilesystem) {
        await instance.writeFile(file.path, Buffer.from(file.contentBase64, 'base64'));
      }
    }

    return instance;
  }
}
