/**
 * @package @semantiq/adapter-cloud-base
 * Cloud Authentication & Secret Sanitization Manager
 */

import type { CloudAuthConfig } from "./types.js";

export class CloudAuthenticationManager {
  private authConfig?: CloudAuthConfig;
  private readonly secretPatterns: RegExp[] = [];

  configure(auth: CloudAuthConfig): void {
    this.authConfig = auth;
    if (auth.apiKey) {
      this.secretPatterns.push(new RegExp(auth.apiKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
    }
  }

  getAuthConfig(): CloudAuthConfig {
    if (!this.authConfig) {
      throw new Error("Cloud authentication has not been configured.");
    }
    return this.authConfig;
  }

  scrubSecrets(text: string): string {
    if (!text) return "";
    let result = text;
    for (const pattern of this.secretPatterns) {
      result = result.replace(pattern, "[REDACTED_CLOUD_SECRET]");
    }
    return result;
  }
}
