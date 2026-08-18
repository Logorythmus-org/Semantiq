/**
 * @package @tech-club/api
 * Authoritative Headless API Entrypoint
 */

export * from "../../semantiq/src/http/index.js";

export const apiPackage = {
  name: "api",
  maturity: "active",
  headless: true
} as const;
