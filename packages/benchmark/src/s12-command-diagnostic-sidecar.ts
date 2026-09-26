import { computeSha256 } from "../../sandbox-contracts/src/index.js";

export const S12_COMMAND_DIAGNOSTIC_POLICY_ID = "S12_COMMAND_DIAGNOSTIC_POLICY" as const;
export const S12_COMMAND_DIAGNOSTIC_POLICY_VERSION = "0.1.0" as const;
export const S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_ID = "S12_COMMAND_DIAGNOSTIC_SIDECAR" as const;
export const S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_VERSION = "0.1.0" as const;
export const S12_COMMAND_DIAGNOSTIC_PREVIEW_LIMIT_UTF16 = 4096;

export interface S12CommandDiagnosticAssociation {
  readonly runId: string;
  readonly attemptId: string;
  readonly toolCallId: string;
}

export interface S12CapturedCommandOutput extends S12CommandDiagnosticAssociation {
  readonly stdout: string;
  readonly stderr: string;
}

export type S12CommandDiagnosticStreamStatus = "AVAILABLE" | "EMPTY" | "UNAVAILABLE";

export interface S12CommandDiagnosticStream {
  readonly status: S12CommandDiagnosticStreamStatus;
  readonly completeCapturedDecodedStreamDigest?: string;
  readonly digestRepresentation?: "SHA256_UTF8_COMPLETE_DECODED_STRING";
  readonly preview?: string;
  readonly previewTruncated?: boolean;
}

export interface S12CommandDiagnosticRecord extends S12CommandDiagnosticAssociation {
  readonly policyId: typeof S12_COMMAND_DIAGNOSTIC_POLICY_ID;
  readonly policyVersion: typeof S12_COMMAND_DIAGNOSTIC_POLICY_VERSION;
  readonly schemaId: typeof S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_ID;
  readonly schemaVersion: typeof S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_VERSION;
  readonly stdout: S12CommandDiagnosticStream;
  readonly stderr: S12CommandDiagnosticStream;
}

export interface S12CommandDiagnosticSidecar {
  readonly artifactType: typeof S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_ID;
  readonly schemaVersion: typeof S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_VERSION;
  readonly policyId: typeof S12_COMMAND_DIAGNOSTIC_POLICY_ID;
  readonly policyVersion: typeof S12_COMMAND_DIAGNOSTIC_POLICY_VERSION;
  readonly authority: "NON_AUTHORITATIVE_OBSERVABILITY";
  readonly records: readonly S12CommandDiagnosticRecord[];
}

export type S12DiagnosticProjector = (input: {
  readonly stream: string;
  readonly knownCredentialValues: readonly string[];
}) => string;

export interface S12CommandDiagnosticSidecarOptions {
  /** Exact runtime credentials only; values are retained ephemerally for replacement. */
  readonly knownCredentialValues?: readonly string[];
  readonly projector?: S12DiagnosticProjector;
  /** Injection seam for proving optional artifact construction cannot fail execution. */
  readonly artifactFactory?: (sidecar: S12CommandDiagnosticSidecar) => S12CommandDiagnosticSidecar;
}

type PendingRecord =
  | ({ readonly kind: "COMPLETE" } & S12CapturedCommandOutput)
  | ({ readonly kind: "UNAVAILABLE" } & S12CommandDiagnosticAssociation);

/** Collects stream references during execution and projects them only after canonical execution ends. */
export class S12CommandDiagnosticSidecarBuilder {
  private readonly pending: PendingRecord[] = [];
  private readonly knownCredentialValues: readonly string[];
  private readonly projector: S12DiagnosticProjector;
  private readonly artifactFactory: (
    sidecar: S12CommandDiagnosticSidecar
  ) => S12CommandDiagnosticSidecar;

  constructor(options: S12CommandDiagnosticSidecarOptions = {}) {
    this.knownCredentialValues = [...(options.knownCredentialValues ?? [])].filter(Boolean);
    this.projector = options.projector ?? redactS12CommandDiagnosticStream;
    this.artifactFactory = options.artifactFactory ?? ((sidecar) => sidecar);
  }

  captureCompleted(output: S12CapturedCommandOutput): void {
    try {
      this.pending.push({ kind: "COMPLETE", ...output });
    } catch {
      // Optional observation storage must never affect command execution.
    }
  }

  recordUnavailable(association: S12CommandDiagnosticAssociation): void {
    try {
      this.pending.push({ kind: "UNAVAILABLE", ...association });
    } catch {
      // Optional observation storage must never affect command execution.
    }
  }

  build(): S12CommandDiagnosticSidecar | undefined {
    try {
      if (this.pending.length === 0) return undefined;
      const records = this.pending.map((record): S12CommandDiagnosticRecord => {
        const association = {
          runId: record.runId,
          attemptId: record.attemptId,
          toolCallId: record.toolCallId
        };
        const common = {
          ...association,
          policyId: S12_COMMAND_DIAGNOSTIC_POLICY_ID,
          policyVersion: S12_COMMAND_DIAGNOSTIC_POLICY_VERSION,
          schemaId: S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_ID,
          schemaVersion: S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_VERSION
        } as const;
        if (record.kind === "UNAVAILABLE")
          return {
            ...common,
            stdout: { status: "UNAVAILABLE" },
            stderr: { status: "UNAVAILABLE" }
          };
        return {
          ...common,
          stdout: this.projectStream(record.stdout),
          stderr: this.projectStream(record.stderr)
        };
      });
      const sidecar: S12CommandDiagnosticSidecar = {
        artifactType: S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_ID,
        schemaVersion: S12_COMMAND_DIAGNOSTIC_SIDECAR_SCHEMA_VERSION,
        policyId: S12_COMMAND_DIAGNOSTIC_POLICY_ID,
        policyVersion: S12_COMMAND_DIAGNOSTIC_POLICY_VERSION,
        authority: "NON_AUTHORITATIVE_OBSERVABILITY",
        records
      };
      return this.artifactFactory(sidecar);
    } catch {
      return undefined;
    }
  }

  private projectStream(stream: string): S12CommandDiagnosticStream {
    let digest: string | undefined;
    try {
      // The digest is SHA-256 of the UTF-8 encoding of the complete decoded JS string.
      digest = computeSha256(Buffer.from(stream, "utf8"));
    } catch {
      return { status: "UNAVAILABLE" };
    }
    const digestFields = {
      completeCapturedDecodedStreamDigest: digest,
      digestRepresentation: "SHA256_UTF8_COMPLETE_DECODED_STRING" as const
    };
    if (stream.length === 0)
      return { status: "EMPTY", ...digestFields, preview: "", previewTruncated: false };
    try {
      const redacted = this.projector({
        stream,
        knownCredentialValues: this.knownCredentialValues
      });
      let previewTruncated = redacted.length > S12_COMMAND_DIAGNOSTIC_PREVIEW_LIMIT_UTF16;
      let preview = redacted.slice(0, S12_COMMAND_DIAGNOSTIC_PREVIEW_LIMIT_UTF16);
      if (endsWithUnmatchedHighSurrogate(preview)) {
        preview = preview.slice(0, -1);
        previewTruncated = true;
      }
      return { status: "AVAILABLE", ...digestFields, preview, previewTruncated };
    } catch {
      return { status: "UNAVAILABLE", ...digestFields };
    }
  }
}

/** Applies deterministic secret/path redaction to the full decoded stream before any projection. */
export function redactS12CommandDiagnosticStream(input: {
  readonly stream: string;
  readonly knownCredentialValues: readonly string[];
}): string {
  let value = input.stream.replace(/\\"/g, '"').replace(/\\\//g, "/");
  for (const credential of input.knownCredentialValues) {
    if (!credential) continue;
    value = value.split(credential).join("[REDACTED_CREDENTIAL]");
    const escaped = JSON.stringify(credential).slice(1, -1);
    if (escaped !== credential) value = value.split(escaped).join("[REDACTED_CREDENTIAL]");
  }

  value = value.replace(/\bAuthorization\s*:\s*[^\r\n]*/gi, "Authorization: [REDACTED]");
  value = value.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+={0,2}/gi, "Bearer [REDACTED]");
  value = value.replace(
    /((?:["']?)[A-Za-z0-9_.-]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|ACCESS[_-]?KEY)[A-Za-z0-9_.-]*(?:["']?\s*[:=]\s*["']?))([^"'\s,;}]*)/gi,
    "$1[REDACTED]"
  );
  value = value.replace(/\bsk-(?:or-v1-|proj-)?[A-Za-z0-9_-]{8,}\b/gi, "[REDACTED_CREDENTIAL]");
  value = value.replace(/\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, "[REDACTED_CREDENTIAL]");
  value = value.replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_CREDENTIAL]");

  value = value.replace(
    /(?:^|(?<![A-Za-z0-9]))[A-Za-z]:[\\/]{1,2}(?:[^\\/\s"'<>|,;]+[\\/]{1,2})*[^\\/\s"'<>|,;]*/g,
    "[REDACTED_HOST_PATH]"
  );
  value = value.replace(
    /(?:^|(?<![A-Za-z0-9]))(?:\\{2,4}|\/\/)[^\\/\s"'<>|,;]+[\\/]{1,2}[^\\/\s"'<>|,;]+(?:[\\/]{1,2}[^\\/\s"'<>|,;]+)*/g,
    "[REDACTED_HOST_PATH]"
  );
  value = value.replace(
    /(?<![A-Za-z0-9:/])\/(?:[^/\s"'<>|,;]+(?:\/[^\s"'<>|,;]*)*)/g,
    "[REDACTED_HOST_PATH]"
  );
  return value;
}

function endsWithUnmatchedHighSurrogate(value: string): boolean {
  if (value.length === 0) return false;
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xd800 && last <= 0xdbff;
}
