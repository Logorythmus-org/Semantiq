export const SEMANTIQ_RELEASE_VERSION = "0.1.0-alpha.2";
export const SEMANTIQ_MATURITY = "Public Alpha (Experimental)";

export const SEMANTIQ_VERSION_MODEL = Object.freeze({
  releaseVersion: SEMANTIQ_RELEASE_VERSION,
  maturity: SEMANTIQ_MATURITY,
  schemaVersionKind: "product-contract-schema" as const,
  httpApiFamily: "v1" as const
});
