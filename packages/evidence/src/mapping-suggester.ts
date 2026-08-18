/**
 * @package @semantiq/evidence
 * Trace Mapping Suggester (Inference & Candidate Generation)
 */

import {
  TraceEventSource,
  TraceEventType
} from "../../sandbox-contracts/src/index.js";
import { SchemaFingerprint } from "./schema-fingerprint.js";
import type {
  EventTypeMappingRule,
  FieldMappingRule,
  ProfileSuggestionResult
} from "./trace-mapping-types.js";

export class MappingSuggester {
  /**
   * Analyzes an unmapped raw event stream and produces a candidate DeclarativeMappingProfile suggestion.
   */
  public suggestProfile(
    schemaName: string,
    sampleEvents: readonly Record<string, unknown>[]
  ): ProfileSuggestionResult {
    const fingerprint = SchemaFingerprint.computeFromEventStream(sampleEvents);
    const suggestedFieldMappings: FieldMappingRule[] = [];
    const suggestedEventTypeMappings: EventTypeMappingRule[] = [];

    if (sampleEvents.length === 0) {
      return {
        sourceSchemaName: schemaName,
        detectedFingerprint: fingerprint,
        suggestedFieldMappings,
        suggestedEventTypeMappings,
        confidence: 0.0
      };
    }

    const first = sampleEvents[0]!;
    const keys = Object.keys(first);

    // 1. Detect ID field
    const idKey = keys.find((k) => /^(id|step_id|event_id|uuid)$/i.test(k));
    if (idKey) {
      suggestedFieldMappings.push({
        sourceField: idKey,
        targetField: "id",
        required: true,
        transform: "to_string"
      });
    }

    // 2. Detect Timestamp field
    const timeKey = keys.find((k) => /^(time|timestamp|created_at|date)$/i.test(k));
    if (timeKey) {
      suggestedFieldMappings.push({
        sourceField: timeKey,
        targetField: "timestamp",
        required: true,
        transform: "timestamp_iso"
      });
    }

    // 3. Detect Payload / Data field
    const dataKey = keys.find((k) => /^(payload|data|arguments|content|body)$/i.test(k));
    if (dataKey) {
      suggestedFieldMappings.push({
        sourceField: dataKey,
        targetField: "payload",
        required: false,
        transform: "to_json"
      });
    }

    // 4. Detect Event Types
    const rawTypes = new Set<string>();
    for (const evt of sampleEvents) {
      const t = evt["type"] ?? evt["event"] ?? evt["kind"] ?? evt["role"];
      if (typeof t === "string") {
        rawTypes.add(t);
      }
    }

    for (const rawType of rawTypes) {
      const lower = rawType.toLowerCase();
      if (lower.includes("tool") || lower.includes("call") || lower.includes("function")) {
        suggestedEventTypeMappings.push({
          rawEventType: rawType,
          canonicalType: TraceEventType.TOOL_CALL,
          canonicalSource: TraceEventSource.AGENT
        });
      } else if (lower.includes("result") || lower.includes("output")) {
        suggestedEventTypeMappings.push({
          rawEventType: rawType,
          canonicalType: TraceEventType.TOOL_RESULT,
          canonicalSource: TraceEventSource.ENVIRONMENT
        });
      } else if (lower.includes("user") || lower.includes("prompt") || lower.includes("input") || lower.includes("system")) {
        suggestedEventTypeMappings.push({
          rawEventType: rawType,
          canonicalType: TraceEventType.PROMPT,
          canonicalSource: TraceEventSource.SYSTEM
        });
      } else if (lower.includes("assistant") || lower.includes("reply") || lower.includes("response") || lower.includes("agent")) {
        suggestedEventTypeMappings.push({
          rawEventType: rawType,
          canonicalType: TraceEventType.RESPONSE,
          canonicalSource: TraceEventSource.AGENT
        });
      } else {
        suggestedEventTypeMappings.push({
          rawEventType: rawType,
          canonicalType: TraceEventType.OBSERVATION,
          canonicalSource: TraceEventSource.OBSERVER
        });
      }
    }

    const confidence = suggestedFieldMappings.length >= 2 && suggestedEventTypeMappings.length > 0 ? 0.9 : 0.6;

    return {
      sourceSchemaName: schemaName,
      detectedFingerprint: fingerprint,
      suggestedFieldMappings,
      suggestedEventTypeMappings,
      confidence
    };
  }
}
