import { describe, it, expect } from 'vitest';
import { SecurityBoundaryEnforcer } from '../../packages/sandbox-contracts/src/security-boundary.js';
import type { SecurityBoundaryPolicy } from '../../packages/sandbox-contracts/src/security-boundary.js';

describe('SemantIQ Sandbox Phase — Security Boundary', () => {
  const enforcer = new SecurityBoundaryEnforcer();

  const standardPolicy: SecurityBoundaryPolicy = {
    networkMode: 'whitelisted_egress',
    blockedCidrRanges: ['169.254.169.254/32'],
    whitelistedHosts: ['api.github.com', 'registry.npmjs.org'],
    readOnlyRootFilesystem: true,
    dropCapabilities: ['CAP_SYS_ADMIN', 'CAP_NET_RAW'],
    allowHostBindMounts: false,
    maxProcesses: 64,
    blockCloudMetadata: true
  };

  it('detects and flags critical breach when agent probes cloud metadata service', () => {
    const violation = enforcer.auditNetworkTarget('http://169.254.169.254/latest/meta-data', standardPolicy, 'agent-01');
    expect(violation).not.toBeNull();
    expect(violation?.severity).toBe('CRITICAL_BREACH');
    expect(violation?.boundary).toBe('sandbox_network');
    expect(violation?.description).toContain('cloud metadata service');
  });

  it('detects and flags unauthorized network host when whitelisted egress is active', () => {
    const violation = enforcer.auditNetworkTarget('evil-c2-server.com', standardPolicy, 'agent-01');
    expect(violation).not.toBeNull();
    expect(violation?.severity).toBe('HIGH');
    expect(violation?.targetResource).toBe('evil-c2-server.com');

    // Authorized host should pass
    const allowed = enforcer.auditNetworkTarget('api.github.com', standardPolicy, 'agent-01');
    expect(allowed).toBeNull();
  });

  it('detects host escape attempts via sensitive filesystem paths', () => {
    const violation = enforcer.auditFilesystemPath('/var/run/docker.sock', true, standardPolicy, 'agent-01');
    expect(violation).not.toBeNull();
    expect(violation?.severity).toBe('CRITICAL_BREACH');
    expect(violation?.boundary).toBe('sandbox_host');
  });

  it('generates containment report and quarantines instance upon critical breach', () => {
    const violation = enforcer.auditFilesystemPath('/etc/shadow', false, standardPolicy, 'agent-01');
    expect(violation).not.toBeNull();

    const report = enforcer.generateContainmentReport('inst-001', standardPolicy, [violation!]);
    expect(report.isBreachDetected).toBe(true);
    expect(report.quarantined).toBe(true);
    expect(report.violations.length).toBe(1);
  });
});
