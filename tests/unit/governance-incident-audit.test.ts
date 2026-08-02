import { describe, it, expect } from 'vitest';
import type { GovernanceIncidentBundle } from '../../packages/semantiq/src/governance-incident-audit.js';
import { GovernanceIncidentAuditEngine } from '../../packages/semantiq/src/governance-incident-audit.js';

describe('Governance Incident and Audit Bundles (Prompt 10.6)', () => {
  const engine = new GovernanceIncidentAuditEngine();

  const validBundle: GovernanceIncidentBundle = {
    incidentId: 'inc_101',
    scope: {
      scopeId: 'scope_101',
      targetDomain: 'security.access',
      startTimestamp: '2026-08-01T10:00:00Z',
      endTimestamp: '2026-08-01T12:00:00Z'
    },
    policyRef: 'pol_sec_v1',
    approvalRef: 'dec_app_101',
    eventInventory: {
      inventoryId: 'inv_101',
      checksums: [{ uri: 'file:///tmp/event1.json', algorithm: 'sha256', hash: 'hash1' }],
      isDeterministic: true
    },
    recoveryCompleted: true,
    residualRiskScore: 0.05,
    timestamp: '2026-08-01T12:30:00Z'
  };

  it('approves compliant incident bundle evaluation', () => {
    const report = engine.evaluateIncidentBundle(validBundle);
    expect(report).toBeUndefined();
  });

  it('detects missing policy version evidence', () => {
    const noPolBundle: GovernanceIncidentBundle = {
      ...validBundle,
      policyRef: undefined
    };
    const report = engine.evaluateIncidentBundle(noPolBundle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('missing_policy_evidence');
  });

  it('detects missing human approval evidence', () => {
    const noAppBundle: GovernanceIncidentBundle = {
      ...validBundle,
      approvalRef: ''
    };
    const report = engine.evaluateIncidentBundle(noAppBundle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('missing_approval');
  });

  it('detects non-deterministic inventory', () => {
    const nondetBundle: GovernanceIncidentBundle = {
      ...validBundle,
      eventInventory: {
        ...validBundle.eventInventory,
        isDeterministic: false
      }
    };
    const report = engine.evaluateIncidentBundle(nondetBundle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('nondeterministic_inventory');
  });

  it('detects incomplete recovery', () => {
    const incompBundle: GovernanceIncidentBundle = {
      ...validBundle,
      recoveryCompleted: false
    };
    const report = engine.evaluateIncidentBundle(incompBundle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('incomplete_recovery');
  });
});
