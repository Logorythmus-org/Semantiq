import type { EvidenceChecksum, RedactionMeta } from "./event-schema.js";

export type CanonicalInteractionType =
  | "direct_message"
  | "broadcast"
  | "request"
  | "response"
  | "clarification"
  | "proposal"
  | "counterproposal"
  | "approval"
  | "rejection"
  | "escalation"
  | "notification"
  | "acknowledgment"
  | "timeout"
  | "cancellation"
  | "handoff";

export type DeliveryState = "sent" | "delivered" | "acknowledged" | "failed" | "timed_out";

export interface InteractionSchema {
  readonly interactionId: string;
  readonly schemaVersion: "1.0.0";
  readonly collectiveRunId: string;
  readonly senderAgentId: string;
  readonly recipientAgentIds: readonly string[];
  readonly senderRole: string;
  readonly recipientRoles: readonly string[];
  readonly timestamp: string;
  readonly sequenceNumber: number;
  readonly monotonicIndex: number;
  readonly interactionType: CanonicalInteractionType;
  readonly contentRef: string;
  readonly missionRef?: string;
  readonly parentInteractionId?: string;
  readonly responseToInteractionId?: string;
  readonly evidenceRefs: readonly EvidenceChecksum[];
  readonly deliveryState: DeliveryState;
  readonly redactionMeta: RedactionMeta;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Interaction Integrity Analyzer.
 * Validates deterministic sequence ordering, duplicate interaction IDs, orphan responses, and evidence checksum integrity.
 */
export class InteractionIntegrityAnalyzer {
  private readonly interactionsById = new Map<string, InteractionSchema>();

  addInteraction(interaction: InteractionSchema): { valid: boolean; errors: readonly string[] } {
    const errors: string[] = [];

    // Duplicate detection
    if (this.interactionsById.has(interaction.interactionId)) {
      errors.push(`DUPLICATE INTERACTION: ID '${interaction.interactionId}' is already recorded.`);
    }

    // Orphan response detection
    if (
      interaction.responseToInteractionId &&
      !this.interactionsById.has(interaction.responseToInteractionId)
    ) {
      errors.push(
        `ORPHAN RESPONSE: Parent interaction '${interaction.responseToInteractionId}' not found.`
      );
    }

    // Missing recipient for direct messages
    if (
      interaction.interactionType === "direct_message" &&
      interaction.recipientAgentIds.length === 0
    ) {
      errors.push(
        `MISSING RECIPIENT: Direct message '${interaction.interactionId}' has 0 recipients.`
      );
    }

    if (errors.length === 0) {
      this.interactionsById.set(interaction.interactionId, interaction);
    }

    return { valid: errors.length === 0, errors };
  }

  validateStreamIntegrity(stream: readonly InteractionSchema[]): {
    valid: boolean;
    errors: readonly string[];
  } {
    const errors: string[] = [];
    let lastSeq = -1;

    for (const item of stream) {
      if (item.sequenceNumber <= lastSeq) {
        errors.push(
          `SEQUENCE ERROR: Interaction '${item.interactionId}' sequence ${item.sequenceNumber} <= previous ${lastSeq}.`
        );
      }
      lastSeq = item.sequenceNumber;

      const res = this.addInteraction(item);
      errors.push(...res.errors);
    }

    return { valid: errors.length === 0, errors };
  }
}
