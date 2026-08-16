import { describe, it, expect } from "vitest";
import {
  SemantiqProviderAdapter,
  MockReferenceProviderAdapter,
  ProviderConformanceHarness,
  type ProviderConfig,
  type EnvironmentSpec,
  type EnvironmentHandle,
  type CommandSpec,
  type CommandResult
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Provider SDK Architecture", () => {
  const harness = new ProviderConformanceHarness();

  it("implements SemantiqProviderAdapter and runs full lifecycle", async () => {
    const adapter = new MockReferenceProviderAdapter();
    await adapter.initialize({
      providerId: "provider-reference-mock",
      version: "1.0.0",
      endpoint: "http://localhost/test"
    });

    const handle = await adapter.provisionEnvironment({
      specVersion: "1.0.0",
      runtimeType: "container",
      image: {
        name: "alpine:latest",
        digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
      },
      workingDirectory: "/workspace",
      resources: {
        cpuLimitCores: 1,
        memoryLimitMebibytes: 512,
        diskLimitMebibytes: 1024,
        maxExecutionTimeoutSeconds: 60
      },
      security: {
        networkMode: "none",
        readOnlyRootFilesystem: true
      }
    });

    expect(handle.providerId).toBe("provider-reference-mock");

    const result = await adapter.executeCommand(handle, {
      command: 'echo "Test"'
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Mock executed");

    await adapter.destroyEnvironment(handle);
  });

  it("certifies compliant third-party provider adapter with verifiable certificate", async () => {
    const adapter = new MockReferenceProviderAdapter();
    const cert = await harness.certifyAdapter(adapter);

    expect(cert.isCertified).toBe(true);
    expect(cert.passedChecks.length).toBe(4);
    expect(cert.failedChecks.length).toBe(0);
    expect(cert.passedChecks).toContain("INITIALIZE_HOOK_COMPLIANT");
    expect(cert.passedChecks).toContain("PROVISION_ENVIRONMENT_COMPLIANT");
    expect(cert.passedChecks).toContain("EXECUTE_COMMAND_COMPLIANT");
    expect(cert.passedChecks).toContain("DESTROY_ENVIRONMENT_COMPLIANT");
    expect(cert.certificateSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("fails certification on non-compliant adapter throwing provisioning errors", async () => {
    class FailingProviderAdapter extends SemantiqProviderAdapter {
      readonly providerId = "provider-failing-mock";
      readonly version = "0.1.0";

      async initialize(_config: ProviderConfig): Promise<void> {}
      async provisionEnvironment(_spec: EnvironmentSpec): Promise<EnvironmentHandle> {
        throw new Error("Host daemon socket connection refused");
      }
      async executeCommand(_handle: EnvironmentHandle, _cmd: CommandSpec): Promise<CommandResult> {
        throw new Error("Not reached");
      }
      async destroyEnvironment(_handle: EnvironmentHandle): Promise<void> {}
    }

    const failingAdapter = new FailingProviderAdapter();
    const cert = await harness.certifyAdapter(failingAdapter);

    expect(cert.isCertified).toBe(false);
    expect(cert.failedChecks.length).toBeGreaterThan(0);
    expect(cert.failedChecks.some((f) => f.includes("Host daemon socket connection refused"))).toBe(
      true
    );
  });
});
