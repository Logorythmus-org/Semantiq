/**
 * @package @tech-club/sandbox-contracts
 * Canonical JSON Schemas (Draft 2020-12)
 */

export const environmentSpecSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://semantiq.dev/schemas/sandbox/environment-spec.json',
  title: 'EnvironmentSpec',
  type: 'object',
  required: ['specVersion', 'runtimeType', 'image', 'resources', 'security'],
  properties: {
    specVersion: { type: 'string' },
    runtimeType: { type: 'string', enum: ['container', 'microvm', 'remote_managed', 'replay'] },
    image: {
      type: 'object',
      required: ['name', 'digest'],
      properties: {
        name: { type: 'string' },
        tag: { type: 'string' },
        digest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' }
      }
    },
    workingDirectory: { type: 'string', default: '/workspace' },
    environmentVariables: {
      type: 'object',
      additionalProperties: { type: 'string' }
    },
    resources: {
      type: 'object',
      required: ['cpuLimitCores', 'memoryLimitMebibytes', 'diskLimitMebibytes', 'maxExecutionTimeoutSeconds'],
      properties: {
        cpuLimitCores: { type: 'number', minimum: 0.1 },
        memoryLimitMebibytes: { type: 'integer', minimum: 32 },
        diskLimitMebibytes: { type: 'integer', minimum: 64 },
        maxProcessCount: { type: 'integer' },
        maxExecutionTimeoutSeconds: { type: 'integer', minimum: 1 }
      }
    },
    security: {
      type: 'object',
      required: ['networkMode', 'readOnlyRootFilesystem'],
      properties: {
        networkMode: { type: 'string', enum: ['none', 'isolated_bridge', 'whitelisted_egress', 'full'] },
        whitelistedHosts: { type: 'array', items: { type: 'string' } },
        readOnlyRootFilesystem: { type: 'boolean' },
        unprivilegedUser: { type: 'string' },
        dropCapabilities: { type: 'array', items: { type: 'string' } }
      }
    }
  }
} as const;

export const executionRequestSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://semantiq.dev/schemas/sandbox/execution-request.json',
  title: 'ExecutionRequest',
  type: 'object',
  required: ['requestId', 'command', 'timeoutMs'],
  properties: {
    requestId: { type: 'string' },
    command: { type: 'array', items: { type: 'string' }, minItems: 1 },
    stdinBase64: { type: 'string' },
    workingDirectory: { type: 'string' },
    envOverrides: { type: 'object', additionalProperties: { type: 'string' } },
    timeoutMs: { type: 'integer', minimum: 100 },
    captureStateDelta: { type: 'boolean' }
  }
} as const;

export const executionResultSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://semantiq.dev/schemas/sandbox/execution-result.json',
  title: 'ExecutionResult',
  type: 'object',
  required: ['requestId', 'exitCode', 'stdout', 'stderr', 'durationMs', 'peakMemoryBytes', 'timedOut', 'oomKilled'],
  properties: {
    requestId: { type: 'string' },
    exitCode: { type: 'integer' },
    stdout: { type: 'string' },
    stderr: { type: 'string' },
    stdoutTruncated: { type: 'boolean' },
    stderrTruncated: { type: 'boolean' },
    durationMs: { type: 'integer' },
    peakMemoryBytes: { type: 'integer' },
    timedOut: { type: 'boolean' },
    oomKilled: { type: 'boolean' }
  }
} as const;
