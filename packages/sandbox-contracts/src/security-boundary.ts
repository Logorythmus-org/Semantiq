/**
 * @package @tech-club/sandbox-contracts
 * Security Boundary Specifications, Policies, and Containment Enforcement
 */

import type { NetworkMode } from './types.js';

export type IsolationBoundaryType =
  | 'agent_sandbox'
  | 'sandbox_host'
  | 'sandbox_network'
  | 'agent_tools'
  | 'sandbox_provider'
  | 'provider_semantiq';

export type SecurityViolationSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL_BREACH';

export interface SecurityBoundaryPolicy {
  readonly networkMode: NetworkMode;
  readonly blockedCidrRanges: readonly string[];
  readonly whitelistedHosts: readonly string[];
  readonly readOnlyRootFilesystem: boolean;
  readonly dropCapabilities: readonly string[];
  readonly allowHostBindMounts: boolean;
  readonly maxProcesses: number;
  readonly blockCloudMetadata: boolean;
}

export interface SecurityViolationEvent {
  readonly violationId: string;
  readonly boundary: IsolationBoundaryType;
  readonly severity: SecurityViolationSeverity;
  readonly targetResource: string;
  readonly actorId: string;
  readonly description: string;
  readonly timestamp: string;
}

export interface SecurityContainmentReport {
  readonly instanceId: string;
  readonly policyEnforced: SecurityBoundaryPolicy;
  readonly isBreachDetected: boolean;
  readonly violations: readonly SecurityViolationEvent[];
  readonly quarantined: boolean;
  readonly auditedAt: string;
}

/**
 * Security Boundary Enforcer.
 * Audits runtime execution requests, network targets, and filesystem operations
 * to ensure strict containment across all 6 architectural security boundaries.
 */
export class SecurityBoundaryEnforcer {
  private readonly defaultBlockedIps = ['169.254.169.254', '127.0.0.1/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

  auditNetworkTarget(targetHost: string, policy: SecurityBoundaryPolicy, actorId = 'agent'): SecurityViolationEvent | null {
    // 1. Cloud metadata endpoint protection
    if (policy.blockCloudMetadata && (targetHost.includes('169.254.169.254') || targetHost.includes('metadata.google.internal'))) {
      return {
        violationId: `sec-viol-${Date.now()}`,
        boundary: 'sandbox_network',
        severity: 'CRITICAL_BREACH',
        targetResource: targetHost,
        actorId,
        description: 'Attempted access to cloud metadata service endpoint.',
        timestamp: new Date().toISOString()
      };
    }

    // 2. Strict network mode: none
    if (policy.networkMode === 'none' && targetHost !== 'localhost' && targetHost !== '127.0.0.1') {
      return {
        violationId: `sec-viol-${Date.now()}`,
        boundary: 'sandbox_network',
        severity: 'HIGH',
        targetResource: targetHost,
        actorId,
        description: 'Outbound network access attempted when networkMode is set to "none".',
        timestamp: new Date().toISOString()
      };
    }

    // 3. Whitelisted egress check
    if (policy.networkMode === 'whitelisted_egress') {
      const isAllowed = policy.whitelistedHosts.some(allowed => targetHost === allowed || targetHost.endsWith(`.${allowed}`));
      if (!isAllowed) {
        return {
          violationId: `sec-viol-${Date.now()}`,
          boundary: 'sandbox_network',
          severity: 'HIGH',
          targetResource: targetHost,
          actorId,
          description: `Host "${targetHost}" is not in the authorized egress whitelist.`,
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  auditFilesystemPath(requestedPath: string, isWrite: boolean, policy: SecurityBoundaryPolicy, actorId = 'agent'): SecurityViolationEvent | null {
    const forbiddenHostPrefixes = ['/etc/shadow', '/etc/sudoers', '/proc/kcore', '/sys/firmware', '/var/run/docker.sock', '~/.ssh', '~/.aws'];

    for (const forbidden of forbiddenHostPrefixes) {
      if (requestedPath.includes(forbidden)) {
        return {
          violationId: `sec-viol-${Date.now()}`,
          boundary: 'sandbox_host',
          severity: 'CRITICAL_BREACH',
          targetResource: requestedPath,
          actorId,
          description: `Attempted access to sensitive host filesystem resource: ${requestedPath}`,
          timestamp: new Date().toISOString()
        };
      }
    }

    if (isWrite && policy.readOnlyRootFilesystem && !requestedPath.startsWith('/tmp') && !requestedPath.startsWith('/workspace')) {
      return {
        violationId: `sec-viol-${Date.now()}`,
        boundary: 'agent_sandbox',
        severity: 'MEDIUM',
        targetResource: requestedPath,
        actorId,
        description: `Write operation attempted on read-only root filesystem path: ${requestedPath}`,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  generateContainmentReport(instanceId: string, policy: SecurityBoundaryPolicy, violations: readonly SecurityViolationEvent[]): SecurityContainmentReport {
    const hasCritical = violations.some(v => v.severity === 'CRITICAL_BREACH' || v.severity === 'HIGH');
    return {
      instanceId,
      policyEnforced: policy,
      isBreachDetected: violations.length > 0,
      violations,
      quarantined: hasCritical,
      auditedAt: new Date().toISOString()
    };
  }
}
