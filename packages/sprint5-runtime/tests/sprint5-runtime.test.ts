import { describe, expect, it } from "vitest";
import {
  federationAdminScreens,
  federationProtocolMessages,
  LocalSprint5Runtime,
  publicAlphaDeploymentProfile
} from "../src/index.js";

describe("Sprint 5 federation runtime", () => {
  it("runs the critical secure federation journey end to end", async () => {
    const runtime = new LocalSprint5Runtime();
    const result = await runtime.runCriticalFederationJourney();

    expect(result.nodeA.state).toBe("Trusted");
    expect(result.nodeB.state).toBe("Trusted");
    expect(result.invitation.accepted).toBe(true);
    expect(result.trust.state).toBe("Trusted");
    expect(result.agreement.approved).toBe(true);
    expect(result.remoteReference.revoked).toBe(true);
    expect(result.remoteReference.accessState).toBe("Revoked");
    expect(result.sharingPlan.approved).toBe(true);
    expect(result.replication.status).toBe("completed");
    expect(result.sync.state).toBe("Completed");
    expect(result.conflict.resolvedBy).toBe("Preserve both");
    expect(result.searchResults.length).toBeGreaterThan(0);
    expect(result.collaboration.sharedObjectIds).toContain(result.remoteReference.id);
    expect(result.remoteExecution.approved).toBe(true);
    expect(result.semantiqReports).toHaveLength(2);
    expect(result.offlinePackage.nodeMetadata).toHaveLength(2);
    expect(result.health.connectedNodes).toBeGreaterThanOrEqual(2);
  });

  it("emits versioned signed events for the federation audit trail", async () => {
    const runtime = new LocalSprint5Runtime();
    const result = await runtime.runCriticalFederationJourney();
    const eventTypes = result.events.map((event) => event.type);

    for (const required of [
      "NodeIdentityCreated",
      "FederationInvitationCreated",
      "FederationInvitationAccepted",
      "TrustRequested",
      "TrustGranted",
      "FederationPolicyUpdated",
      "FederationAgreementCreated",
      "RemoteReferenceCreated",
      "KnowledgeShareRequested",
      "KnowledgeShared",
      "ReplicationStarted",
      "ReplicationCompleted",
      "SynchronizationStarted",
      "SynchronizationCompleted",
      "ConflictDetected",
      "ConflictResolved",
      "FederatedSearchStarted",
      "FederatedSearchCompleted",
      "CollaborationSessionCreated",
      "RemoteExecutionRequested",
      "RemoteExecutionApproved",
      "RemoteExecutionCompleted",
      "RemoteObjectRevoked",
      "NodeDiscovered"
    ] as const) {
      expect(eventTypes).toContain(required);
    }

    expect(
      result.events.every(
        (event) =>
          event.eventVersion === 1 &&
          Boolean(event.sourceNodeId) &&
          event.signature.verified === true &&
          event.audit.localFirst === true
      )
    ).toBe(true);
  });

  it("validates protocol envelopes, public alpha defaults and the network harness", async () => {
    const runtime = new LocalSprint5Runtime();
    const nodeA = await runtime.createNodeIdentity("identity:a", "node-a", "Personal Node");
    const nodeB = await runtime.createNodeIdentity("identity:b", "node-b", "Research Node");
    const envelope = runtime.createEnvelope(nodeA.id, nodeB.id, "health.request", { ping: true });

    expect(runtime.validateGatewayMessage(envelope)).toBe(true);
    expect(() => runtime.createEnvelope(nodeA.id, nodeB.id, "unsupported.message", {})).toThrow("Unsupported message type");
    expect(runtime.rotateNodeKey(nodeA.id).keyVersion).toBe(2);
    expect(runtime.createNetworkTestHarness()).toHaveLength(5);
    expect(runtime.simulateNetworkFault("replay-attack").handled).toBe(true);
    expect(federationProtocolMessages).toContain("health.request");
    expect(federationAdminScreens).toContain("Federation Overview");
    expect(publicAlphaDeploymentProfile.defaults.openDiscovery).toBe(false);
  });
});
