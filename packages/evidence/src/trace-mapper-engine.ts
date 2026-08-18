/**
 * @package @semantiq/evidence
 * Provenance-Aware Semantic Trace Mapper Engine
 * 
 * Invariants:
 * 1. Only approved mapping profiles are permitted for canonical evidence generation.
 * 2. Unknown/noisy fields remain unresolved (collected in unresolvedFields, never fabricated).
 * 3. Every mapped trace event is cryptographically state-chained.
 */

import {
  type Trace,
  type TraceEvent,
  type TraceEventSource,
  type TraceEventType,
  computeSha256,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  TraceStatus
} from "../../sandbox-contracts/src/index.js";
import { SchemaFingerprint } from "./schema-fingerprint.js";
import type { MappingProfileRegistry } from "./trace-mapping-profile.js";
import {
  type DeclarativeMappingProfile,
  type TraceMappingResult,
  MappingApprovalStatus
} from "./trace-mapping-types.js";

export interface MapTraceOptions {
  readonly runId: string;
  readonly caseId: string;
  readonly rawEvents: readonly Record<string, unknown>[];
  readonly profileId: string;
  readonly profileVersion: string;
}

export class TraceMapperEngine {
  constructor(private readonly registry: MappingProfileRegistry) {}

  public mapRawEventsToCanonicalTrace(options: MapTraceOptions): TraceMappingResult {
    const profile = this.registry.getProfile(options.profileId, options.profileVersion);
    if (!profile) {
      throw new Error(`Mapping profile not found: ${options.profileId}@${options.profileVersion}`);
    }

    if (profile.approvalStatus !== MappingApprovalStatus.APPROVED) {
      throw new Error(
        `Cannot execute mapping with unapproved profile: ${options.profileId}@${options.profileVersion} (status: ${profile.approvalStatus}). Explicit human approval is required.`
      );
    }

    const traceId = `trc_${options.runId}`;
    const detectedFingerprint = SchemaFingerprint.computeFromEventStream(options.rawEvents);

    let previousHash = "0".repeat(64);
    let totalUnresolvedFieldCount = 0;

    const mappedEvents: TraceEvent[] = [];

    for (let i = 0; i < options.rawEvents.length; i++) {
      const raw = options.rawEvents[i]!;

      // 1. Resolve event type & source
      const rawType = String(raw["type"] ?? raw["event"] ?? raw["kind"] ?? "unknown");
      const typeRule = profile.eventTypeMappings.find((m) => m.rawEventType === rawType);

      const canonicalType: TraceEventType =
        typeRule?.canonicalType ?? ("observation" as TraceEventType);
      const canonicalSource: TraceEventSource =
        typeRule?.canonicalSource ?? ("environment" as TraceEventSource);

      // 2. Resolve mapped fields vs unresolved fields
      const mappedPayload: Record<string, unknown> = {};
      const unresolvedFields: Record<string, unknown> = {};

      const mappedSourceKeys = new Set<string>();
      for (const fm of profile.fieldMappings) {
        mappedSourceKeys.add(fm.sourceField);
        if (raw[fm.sourceField] !== undefined) {
          mappedPayload[fm.targetField] = this.applyTransform(raw[fm.sourceField], fm.transform);
        }
      }

      // Collect unknown / noisy fields
      for (const [key, val] of Object.entries(raw)) {
        if (!mappedSourceKeys.has(key) && key !== "type" && key !== "event" && key !== "kind") {
          unresolvedFields[key] = val;
          totalUnresolvedFieldCount++;
        }
      }

      // If unresolved fields exist, preserve them cleanly under unresolvedFields
      if (Object.keys(unresolvedFields).length > 0 && profile.preserveUnresolvedFields) {
        mappedPayload["unresolvedFields"] = unresolvedFields;
      }

      const timestamp = String(
        mappedPayload["timestamp"] ?? raw["timestamp"] ?? raw["time"] ?? new Date().toISOString()
      );

      const eventId = String(mappedPayload["id"] ?? `evt_${options.runId}_${i}`);

      const payloadString = JSON.stringify(mappedPayload);
      const sha256Hash = computeSha256(`${previousHash}:${i}:${timestamp}:${payloadString}`);
      previousHash = sha256Hash;

      mappedEvents.push({
        id: eventId,
        traceId,
        sequenceIndex: i,
        timestamp,
        type: canonicalType,
        source: canonicalSource,
        payload: mappedPayload,
        sha256Hash
      });
    }

    const startedAt = mappedEvents[0]?.timestamp ?? new Date().toISOString();
    const endedAt = mappedEvents[mappedEvents.length - 1]?.timestamp ?? startedAt;

    const trace: Trace = {
      id: traceId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: options.runId,
      caseId: options.caseId,
      status: mappedEvents.length > 0 ? TraceStatus.COMPLETED : TraceStatus.INSUFFICIENT_DATA,
      events: mappedEvents,
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      durationMs: 0,
      startedAt,
      endedAt
    };

    const transformationDigest = computeSha256(
      `${options.profileId}@${options.profileVersion}:${detectedFingerprint}:${previousHash}`
    );

    return {
      trace,
      mappedEventCount: mappedEvents.length,
      unresolvedFieldCount: totalUnresolvedFieldCount,
      schemaFingerprint: detectedFingerprint,
      mappingProfileId: profile.profileId,
      mappingProfileVersion: profile.version,
      transformationDigest
    };
  }

  private applyTransform(
    value: unknown,
    transform?: "direct" | "to_string" | "to_number" | "to_json" | "timestamp_iso"
  ): unknown {
    if (transform === "to_string") return String(value);
    if (transform === "to_number") return Number(value);
    if (transform === "to_json") {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }
    if (transform === "timestamp_iso") {
      try {
        return new Date(value as string | number).toISOString();
      } catch {
        return String(value);
      }
    }
    return value;
  }
}
