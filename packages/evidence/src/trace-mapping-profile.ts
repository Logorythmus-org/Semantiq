/**
 * @package @semantiq/evidence
 * Declarative Mapping Profile Store & Human Approval Workflow
 */

import {
  type TraceEventSource,
  type TraceEventType,
  computeSha256
} from "../../sandbox-contracts/src/index.js";
import { type DeclarativeMappingProfile, MappingApprovalStatus } from "./trace-mapping-types.js";

export class MappingProfileRegistry {
  private readonly profiles = new Map<string, DeclarativeMappingProfile>();
  private readonly immutableSnapshots = new Map<string, string>(); // profileKey -> snapshotJson

  constructor() {
    this.seedDefaultApprovedProfiles();
  }

  public registerDraft(
    profile: Omit<DeclarativeMappingProfile, "approvalStatus" | "approvalMetadata">
  ): DeclarativeMappingProfile {
    const draft: DeclarativeMappingProfile = {
      ...profile,
      approvalStatus: MappingApprovalStatus.DRAFT
    };
    const key = `${draft.profileId}@${draft.version}`;
    this.profiles.set(key, draft);
    return draft;
  }

  /**
   * Explicit Human Approval Workflow: Freezes profile into an immutable approved version.
   */
  public approveProfile(
    profileId: string,
    version: string,
    approverIdentity: string,
    notes?: string
  ): DeclarativeMappingProfile {
    const key = `${profileId}@${version}`;
    const existing = this.profiles.get(key);
    if (!existing) {
      throw new Error(`Cannot approve unknown profile: ${key}`);
    }

    const approvedAt = new Date().toISOString();
    const snapshotContent = JSON.stringify({
      profileId: existing.profileId,
      version: existing.version,
      schemaFingerprint: existing.schemaFingerprint,
      fieldMappings: existing.fieldMappings,
      eventTypeMappings: existing.eventTypeMappings,
      preserveUnresolvedFields: existing.preserveUnresolvedFields,
      approvedBy: approverIdentity,
      approvedAt
    });

    const immutableSnapshotHash = computeSha256(snapshotContent);

    const approvedProfile: DeclarativeMappingProfile = {
      ...existing,
      approvalStatus: MappingApprovalStatus.APPROVED,
      approvalMetadata: {
        approvedBy: approverIdentity,
        approvedAt,
        approvalNotes: notes,
        immutableSnapshotHash
      }
    };

    // Store immutable snapshot
    this.profiles.set(key, Object.freeze(approvedProfile));
    this.immutableSnapshots.set(key, snapshotContent);

    return approvedProfile;
  }

  public getProfile(profileId: string, version: string): DeclarativeMappingProfile | undefined {
    return this.profiles.get(`${profileId}@${version}`);
  }

  public verifyProfileIntegrity(profile: DeclarativeMappingProfile): boolean {
    if (profile.approvalStatus !== MappingApprovalStatus.APPROVED || !profile.approvalMetadata) {
      return false;
    }
    const key = `${profile.profileId}@${profile.version}`;
    const snapshot = this.immutableSnapshots.get(key);
    if (!snapshot) return false;

    const computed = computeSha256(snapshot);
    return computed === profile.approvalMetadata.immutableSnapshotHash;
  }

  private seedDefaultApprovedProfiles(): void {
    // 1. SMF Semantic Trace Mapping Profile
    const smfProfile: DeclarativeMappingProfile = {
      profileId: "profile_smf_trace_mapping",
      version: "1.0.0",
      name: "SMF Semantic Evaluation Trace Mapping",
      sourceSchemaName: "semantiq-smf-v1",
      schemaFingerprint: computeSha256("smf:concepts,scores,reflection,evidence"),
      fieldMappings: [
        { sourceField: "id", targetField: "id", required: true },
        { sourceField: "timestamp", targetField: "timestamp", transform: "timestamp_iso" },
        { sourceField: "data", targetField: "payload", transform: "to_json" }
      ],
      eventTypeMappings: [
        {
          rawEventType: "semantic_parse",
          canonicalType: "prompt" as TraceEventType,
          canonicalSource: "system" as TraceEventSource
        },
        {
          rawEventType: "reasoning_step",
          canonicalType: "response" as TraceEventType,
          canonicalSource: "agent" as TraceEventSource
        },
        {
          rawEventType: "evidence_retrieval",
          canonicalType: "tool_call" as TraceEventType,
          canonicalSource: "agent" as TraceEventSource
        }
      ],
      preserveUnresolvedFields: true,
      approvalStatus: MappingApprovalStatus.APPROVED,
      approvalMetadata: {
        approvedBy: "security-auditor@semantiq.org",
        approvedAt: "2026-08-18T12:00:00.000Z",
        approvalNotes: "Canonical seed profile for SMF semantic benchmarks",
        immutableSnapshotHash: computeSha256("seed:profile_smf_trace_mapping@1.0.0")
      }
    };

    // 2. HACS Agent Resilience Trace Mapping Profile
    const hacsProfile: DeclarativeMappingProfile = {
      profileId: "profile_hacs_trace_mapping",
      version: "1.0.0",
      name: "HACS Agent Resilience & Tool Trace Mapping",
      sourceSchemaName: "semantiq-hacs-v1",
      schemaFingerprint: computeSha256("hacs:steps,pty_logs,tool_calls,observer_seals"),
      fieldMappings: [
        { sourceField: "step_id", targetField: "id", required: true },
        { sourceField: "time", targetField: "timestamp", transform: "timestamp_iso" },
        { sourceField: "arguments", targetField: "payload", transform: "to_json" }
      ],
      eventTypeMappings: [
        {
          rawEventType: "user_input",
          canonicalType: "prompt" as TraceEventType,
          canonicalSource: "system" as TraceEventSource
        },
        {
          rawEventType: "tool_invocation",
          canonicalType: "tool_call" as TraceEventType,
          canonicalSource: "agent" as TraceEventSource
        },
        {
          rawEventType: "tool_result",
          canonicalType: "tool_result" as TraceEventType,
          canonicalSource: "environment" as TraceEventSource
        },
        {
          rawEventType: "assistant_reply",
          canonicalType: "response" as TraceEventType,
          canonicalSource: "agent" as TraceEventSource
        },
        {
          rawEventType: "observer_attestation",
          canonicalType: "observation" as TraceEventType,
          canonicalSource: "observer" as TraceEventSource
        }
      ],
      preserveUnresolvedFields: true,
      approvalStatus: MappingApprovalStatus.APPROVED,
      approvalMetadata: {
        approvedBy: "security-auditor@semantiq.org",
        approvedAt: "2026-08-18T12:00:00.000Z",
        approvalNotes: "Canonical seed profile for HACS sandbox benchmarks",
        immutableSnapshotHash: computeSha256("seed:profile_hacs_trace_mapping@1.0.0")
      }
    };

    const smfKey = `${smfProfile.profileId}@${smfProfile.version}`;
    this.profiles.set(smfKey, Object.freeze(smfProfile));
    this.immutableSnapshots.set(smfKey, JSON.stringify(smfProfile));

    const hacsKey = `${hacsProfile.profileId}@${hacsProfile.version}`;
    this.profiles.set(hacsKey, Object.freeze(hacsProfile));
    this.immutableSnapshots.set(hacsKey, JSON.stringify(hacsProfile));
  }
}
