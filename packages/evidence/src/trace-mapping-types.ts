/**
 * @package @semantiq/evidence
 * Semantic Trace Mapping and Provenance Types
 */

import type {
  Trace,
  TraceEvent,
  TraceEventSource,
  TraceEventType
} from "../../sandbox-contracts/src/index.js";

export enum MappingApprovalStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface FieldMappingRule {
  readonly sourceField: string;
  readonly targetField: string;
  readonly required?: boolean;
  readonly transform?: "direct" | "to_string" | "to_number" | "to_json" | "timestamp_iso";
  readonly defaultValue?: unknown;
}

export interface EventTypeMappingRule {
  readonly rawEventType: string;
  readonly canonicalType: TraceEventType;
  readonly canonicalSource: TraceEventSource;
}

export interface DeclarativeMappingProfile {
  readonly profileId: string;
  readonly version: string; // e.g. "1.0.0"
  readonly name: string;
  readonly sourceSchemaName: string;
  readonly schemaFingerprint: string; // SHA-256 of source schema layout
  readonly fieldMappings: readonly FieldMappingRule[];
  readonly eventTypeMappings: readonly EventTypeMappingRule[];
  readonly preserveUnresolvedFields: boolean;
  readonly approvalStatus: MappingApprovalStatus;
  readonly approvalMetadata?:
    | {
        readonly approvedBy: string;
        readonly approvedAt: string;
        readonly approvalNotes?: string | undefined;
        readonly immutableSnapshotHash: string; // SHA-256 seal of the approved profile
      }
    | undefined;
}

export interface MappingSuggestion {
  readonly sourceField: string;
  readonly suggestedTargetField: string;
  readonly confidence: number; // 0.0 to 1.0 deterministic heuristic score
  readonly sampleValue: unknown;
  readonly reason: string;
}

export interface ProfileSuggestionResult {
  readonly sourceSchemaName: string;
  readonly detectedFingerprint: string;
  readonly suggestedFieldMappings: readonly FieldMappingRule[];
  readonly suggestedEventTypeMappings: readonly EventTypeMappingRule[];
  readonly confidence: number;
}

export interface TraceMappingResult {
  readonly trace: Trace;
  readonly mappedEventCount: number;
  readonly unresolvedFieldCount: number;
  readonly schemaFingerprint: string;
  readonly mappingProfileId: string;
  readonly mappingProfileVersion: string;
  readonly transformationDigest: string; // SHA-256 of transformation execution
}
