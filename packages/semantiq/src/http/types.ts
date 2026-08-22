/**
 * @package @tech-club/semantiq
 * Headless HTTP Server & API Types
 */

import type { Server } from "node:http";
import type { SemantiqApplicationService } from "../services/index.js";

export interface SemantiqHttpServerOptions {
  readonly service?: SemantiqApplicationService | undefined;
  readonly port?: number | undefined;
  readonly host?: string | undefined;
  readonly basePath?: string | undefined; // default: "/api/v1"
  readonly staticDir?: string | undefined; // optional directory for static assets
  readonly enableCors?: boolean | undefined;
}

export interface SemantiqHttpApplication {
  readonly server: Server;
  readonly port: number;
  readonly host: string;
  readonly basePath: string;
  readonly service: SemantiqApplicationService;
  start(): Promise<number>;
  stop(): Promise<void>;
}

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T | undefined;
  readonly error?:
    | {
        readonly code: string;
        readonly message: string;
        readonly details?: unknown;
      }
    | undefined;
  readonly meta: {
    readonly timestamp: string;
    readonly version: string;
    readonly versionKind: "schema";
    readonly releaseVersion: string;
    readonly schemaVersion: string;
    readonly maturity: string;
    readonly correlationId: string;
  };
}
