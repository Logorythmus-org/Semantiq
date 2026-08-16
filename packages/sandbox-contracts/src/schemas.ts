/**
 * @package @tech-club/sandbox-contracts
 * Canonical JSON Schemas (Draft 2020-12)
 */

export const environmentSpecSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/environment-spec.json",
  title: "EnvironmentSpec",
  type: "object",
  required: ["specVersion", "runtimeType", "image", "resources", "security"],
  properties: {
    specVersion: { type: "string" },
    runtimeType: { type: "string", enum: ["container", "microvm", "remote_managed", "replay"] },
    image: {
      type: "object",
      required: ["name", "digest"],
      properties: {
        name: { type: "string" },
        tag: { type: "string" },
        digest: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" }
      }
    },
    workingDirectory: { type: "string", default: "/workspace" },
    environmentVariables: {
      type: "object",
      additionalProperties: { type: "string" }
    },
    resources: {
      type: "object",
      required: [
        "cpuLimitCores",
        "memoryLimitMebibytes",
        "diskLimitMebibytes",
        "maxExecutionTimeoutSeconds"
      ],
      properties: {
        cpuLimitCores: { type: "number", minimum: 0.1 },
        memoryLimitMebibytes: { type: "integer", minimum: 32 },
        diskLimitMebibytes: { type: "integer", minimum: 64 },
        maxProcessCount: { type: "integer" },
        maxExecutionTimeoutSeconds: { type: "integer", minimum: 1 }
      }
    },
    security: {
      type: "object",
      required: ["networkMode", "readOnlyRootFilesystem"],
      properties: {
        networkMode: {
          type: "string",
          enum: ["none", "isolated_bridge", "whitelisted_egress", "full"]
        },
        whitelistedHosts: { type: "array", items: { type: "string" } },
        readOnlyRootFilesystem: { type: "boolean" },
        unprivilegedUser: { type: "string" },
        dropCapabilities: { type: "array", items: { type: "string" } }
      }
    }
  }
} as const;

export const executionRequestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/execution-request.json",
  title: "ExecutionRequest",
  type: "object",
  required: ["requestId", "command", "timeoutMs"],
  properties: {
    requestId: { type: "string" },
    command: { type: "array", items: { type: "string" }, minItems: 1 },
    stdinBase64: { type: "string" },
    workingDirectory: { type: "string" },
    envOverrides: { type: "object", additionalProperties: { type: "string" } },
    timeoutMs: { type: "integer", minimum: 100 },
    captureStateDelta: { type: "boolean" }
  }
} as const;

export const executionResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/execution-result.json",
  title: "ExecutionResult",
  type: "object",
  required: [
    "requestId",
    "exitCode",
    "stdout",
    "stderr",
    "durationMs",
    "peakMemoryBytes",
    "timedOut",
    "oomKilled"
  ],
  properties: {
    requestId: { type: "string" },
    exitCode: { type: "integer" },
    stdout: { type: "string" },
    stderr: { type: "string" },
    stdoutTruncated: { type: "boolean" },
    stderrTruncated: { type: "boolean" },
    durationMs: { type: "integer" },
    peakMemoryBytes: { type: "integer" },
    timedOut: { type: "boolean" },
    oomKilled: { type: "boolean" }
  }
} as const;

export const providerEcosystemDescriptorSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-model.json",
  title: "ProviderEcosystemDescriptor",
  type: "object",
  required: [
    "providerId",
    "displayName",
    "version",
    "hostingCategory",
    "license",
    "costStructure",
    "privacyProfile",
    "trustTier",
    "securityGrade",
    "capabilities",
    "extensionMatrix",
    "registeredAt"
  ],
  properties: {
    providerId: { type: "string" },
    displayName: { type: "string" },
    version: { type: "string" },
    hostingCategory: {
      type: "string",
      enum: [
        "LOCAL_OPEN_SOURCE",
        "SELF_HOSTED_DEDICATED",
        "COMMERCIAL_MANAGED_CLOUD",
        "ENTERPRISE_PRIVATE_AIRGAPPED",
        "DETERMINISTIC_REPLAY"
      ]
    },
    license: {
      type: "object",
      required: [
        "spdxId",
        "licenseName",
        "isOsiApproved",
        "isCommercialUseAllowed",
        "copyleftClause"
      ],
      properties: {
        spdxId: { type: "string" },
        licenseName: { type: "string" },
        isOsiApproved: { type: "boolean" },
        isCommercialUseAllowed: { type: "boolean" },
        copyleftClause: { type: "boolean" },
        termsUrl: { type: "string" }
      }
    },
    costStructure: {
      type: "object",
      required: ["billingModel", "baseRatePerUnit", "currency", "minBillingDurationSeconds"],
      properties: {
        billingModel: {
          type: "string",
          enum: [
            "FREE_LOCAL",
            "PER_SECOND",
            "PER_MINUTE",
            "PER_INSTANCE_HOUR",
            "SUBSCRIPTION_TIER",
            "FIXED_PER_RUN"
          ]
        },
        baseRatePerUnit: { type: "number", minimum: 0 },
        currency: { type: "string", enum: ["USD", "EUR", "GBP", "NONE"] },
        minBillingDurationSeconds: { type: "integer", minimum: 0 },
        networkEgressRatePerGb: { type: "number" },
        idleTimeoutSeconds: { type: "integer" }
      }
    },
    privacyProfile: {
      type: "object",
      required: [
        "zeroDataRetentionConfirmed",
        "dataStorageRegion",
        "telemetryPolicy",
        "retentionPolicy",
        "ephemeralWipeVerified",
        "complianceAttestations"
      ],
      properties: {
        zeroDataRetentionConfirmed: { type: "boolean" },
        dataStorageRegion: { type: "string" },
        telemetryPolicy: {
          type: "string",
          enum: ["NO_TELEMETRY", "ANONYMIZED_METRICS", "FULL_TELEMETRY"]
        },
        retentionPolicy: {
          type: "string",
          enum: [
            "EPHEMERAL_ZERO_RETENTION",
            "VOLATILE_UNTIL_TERMINATION",
            "HOST_LOGS_RETAINED_30_DAYS",
            "PERSISTENT_STORAGE"
          ]
        },
        ephemeralWipeVerified: { type: "boolean" },
        complianceAttestations: { type: "array", items: { type: "string" } }
      }
    },
    trustTier: {
      type: "string",
      enum: ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    securityGrade: {
      type: "string",
      enum: ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    capabilities: { type: "object" },
    extensionMatrix: {
      type: "object",
      required: [
        "supportsCustomTelemetry",
        "supportsGpuAcceleration",
        "supportsMemorySnapshots",
        "supportsNetworkInterception",
        "isolatedFromBenchmarkSemantics"
      ],
      properties: {
        supportsCustomTelemetry: { type: "boolean" },
        supportsGpuAcceleration: { type: "boolean" },
        supportsMemorySnapshots: { type: "boolean" },
        supportsNetworkInterception: { type: "boolean" },
        vendorExtensionNamespace: { type: "string" },
        isolatedFromBenchmarkSemantics: { type: "boolean" }
      }
    },
    registeredAt: { type: "string" }
  }
} as const;

export const costAttributionRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/cost-attribution-record.json",
  title: "CostAttributionRecord",
  type: "object",
  required: [
    "attributionId",
    "providerId",
    "instanceId",
    "executionDurationMs",
    "billedDurationMs",
    "computeCost",
    "egressCost",
    "totalCost",
    "currency",
    "billingModel",
    "timestamp"
  ],
  properties: {
    attributionId: { type: "string" },
    providerId: { type: "string" },
    instanceId: { type: "string" },
    executionDurationMs: { type: "integer" },
    billedDurationMs: { type: "integer" },
    computeCost: { type: "number" },
    egressCost: { type: "number" },
    totalCost: { type: "number" },
    currency: { type: "string" },
    billingModel: { type: "string" },
    timestamp: { type: "string" }
  }
} as const;

export const providerMarketplaceListingSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-marketplace-listing.json",
  title: "ProviderMarketplaceListing",
  type: "object",
  required: [
    "listingId",
    "providerId",
    "displayName",
    "description",
    "version",
    "publisher",
    "hostingCategory",
    "deploymentMode",
    "license",
    "costStructure",
    "privacyProfile",
    "trustTier",
    "securityGrade",
    "capabilities",
    "extensionMatrix",
    "slaMetrics",
    "tags",
    "publishedAt",
    "signatureHex"
  ],
  properties: {
    listingId: { type: "string" },
    providerId: { type: "string" },
    displayName: { type: "string" },
    description: { type: "string" },
    version: { type: "string" },
    publisher: {
      type: "object",
      required: ["providerId", "organization", "publicKeyHex", "registeredAt"],
      properties: {
        providerId: { type: "string" },
        organization: { type: "string" },
        publicKeyHex: { type: "string" },
        endpointUrl: { type: "string" },
        registeredAt: { type: "string" }
      }
    },
    hostingCategory: {
      type: "string",
      enum: [
        "LOCAL_OPEN_SOURCE",
        "SELF_HOSTED_DEDICATED",
        "COMMERCIAL_MANAGED_CLOUD",
        "ENTERPRISE_PRIVATE_AIRGAPPED",
        "DETERMINISTIC_REPLAY"
      ]
    },
    deploymentMode: {
      type: "string",
      enum: [
        "LOCAL_DAEMON",
        "DEDICATED_CLUSTER",
        "SERVERLESS_MICROVM",
        "MANAGED_MULTI_TENANT",
        "AIRGAPPED_ON_PREM",
        "MOCK_REPLAY"
      ]
    },
    license: { type: "object" },
    costStructure: { type: "object" },
    privacyProfile: { type: "object" },
    trustTier: {
      type: "string",
      enum: ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    securityGrade: {
      type: "string",
      enum: ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    capabilities: { type: "object" },
    extensionMatrix: { type: "object" },
    slaMetrics: {
      type: "object",
      required: [
        "uptimePercentage",
        "p50ColdBootLatencyMs",
        "p95ColdBootLatencyMs",
        "maxConcurrentSandboxes"
      ],
      properties: {
        uptimePercentage: { type: "number", minimum: 0, maximum: 100 },
        p50ColdBootLatencyMs: { type: "number", minimum: 0 },
        p95ColdBootLatencyMs: { type: "number", minimum: 0 },
        maxConcurrentSandboxes: { type: "integer", minimum: 1 }
      }
    },
    tags: { type: "array", items: { type: "string" } },
    publishedAt: { type: "string" },
    signatureHex: { type: "string" }
  }
} as const;

export const marketplaceDiscoveryQuerySchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/marketplace-discovery-query.json",
  title: "MarketplaceDiscoveryQuery",
  type: "object",
  properties: {
    requiredDeploymentModes: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "LOCAL_DAEMON",
          "DEDICATED_CLUSTER",
          "SERVERLESS_MICROVM",
          "MANAGED_MULTI_TENANT",
          "AIRGAPPED_ON_PREM",
          "MOCK_REPLAY"
        ]
      }
    },
    minTrustTier: {
      type: "string",
      enum: ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    minSecurityGrade: {
      type: "string",
      enum: ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    maxCostPerUnit: { type: "number", minimum: 0 },
    maxColdBootLatencyMs: { type: "number", minimum: 0 },
    region: { type: "string" },
    zeroDataRetentionOnly: { type: "boolean" },
    offlineOnly: { type: "boolean" },
    allowedLicenses: { type: "array", items: { type: "string" } },
    requiredCapabilities: { type: "object" },
    tags: { type: "array", items: { type: "string" } }
  }
} as const;

export const economicPricingModelSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/economic-pricing-model.json",
  title: "EconomicPricingModel",
  type: "object",
  required: [
    "tier",
    "unit",
    "baseUnitPrice",
    "currency",
    "minBillingIncrementSec",
    "egressCostPerGb",
    "coldBootSurcharge",
    "idleReservationCostPerMin"
  ],
  properties: {
    tier: {
      type: "string",
      enum: [
        "COMMUNITY_FREE",
        "SPONSORED_GRANT",
        "COMMERCIAL_PAYG",
        "ENTERPRISE_RESERVED",
        "REPLAY_TRACE"
      ]
    },
    unit: {
      type: "string",
      enum: ["SECOND", "MINUTE", "HOUR", "RUN", "TOKEN_ESTIMATE"]
    },
    baseUnitPrice: { type: "number", minimum: 0 },
    currency: { type: "string", enum: ["USD", "EUR", "CREDITS", "NONE"] },
    minBillingIncrementSec: { type: "integer", minimum: 0 },
    egressCostPerGb: { type: "number", minimum: 0 },
    coldBootSurcharge: { type: "number", minimum: 0 },
    idleReservationCostPerMin: { type: "number", minimum: 0 }
  }
} as const;

export const evaluationGrantAllocationSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/evaluation-grant-allocation.json",
  title: "EvaluationGrantAllocation",
  type: "object",
  required: [
    "grantId",
    "sponsorOrganization",
    "totalCredits",
    "remainingCredits",
    "authorizedBenchmarkSuites",
    "expiresAt"
  ],
  properties: {
    grantId: { type: "string" },
    sponsorOrganization: { type: "string" },
    totalCredits: { type: "number", minimum: 0 },
    remainingCredits: { type: "number", minimum: 0 },
    authorizedBenchmarkSuites: { type: "array", items: { type: "string" } },
    expiresAt: { type: "string" }
  }
} as const;

export const economicExecutionReceiptSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/economic-execution-receipt.json",
  title: "EconomicExecutionReceipt",
  type: "object",
  required: [
    "receiptId",
    "benchmarkId",
    "scenarioId",
    "providerId",
    "economicTier",
    "billedDurationMs",
    "computeCost",
    "egressCost",
    "coldBootCost",
    "totalGrossCost",
    "grantSubsidyApplied",
    "netBilledCost",
    "currency",
    "timestamp",
    "receiptSignatureHex"
  ],
  properties: {
    receiptId: { type: "string" },
    benchmarkId: { type: "string" },
    scenarioId: { type: "string" },
    providerId: { type: "string" },
    economicTier: {
      type: "string",
      enum: [
        "COMMUNITY_FREE",
        "SPONSORED_GRANT",
        "COMMERCIAL_PAYG",
        "ENTERPRISE_RESERVED",
        "REPLAY_TRACE"
      ]
    },
    billedDurationMs: { type: "integer" },
    computeCost: { type: "number" },
    egressCost: { type: "number" },
    coldBootCost: { type: "number" },
    totalGrossCost: { type: "number" },
    grantSubsidyApplied: { type: "number" },
    netBilledCost: { type: "number" },
    currency: { type: "string" },
    sponsorAttribution: { type: "string" },
    costCenter: { type: "string" },
    timestamp: { type: "string" },
    receiptSignatureHex: { type: "string" }
  }
} as const;

export const providerLicensingManifestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-licensing-manifest.json",
  title: "ProviderLicensingManifest",
  type: "object",
  required: [
    "providerId",
    "runtimeName",
    "runtimeLicenseSpdx",
    "runtimeClassification",
    "adapterLicenseSpdx",
    "isolationMechanism",
    "isCleanRoomImplementation",
    "allowsRedistribution",
    "requiresAttributionNotice",
    "thirdPartyNotices",
    "registeredAt"
  ],
  properties: {
    providerId: { type: "string" },
    runtimeName: { type: "string" },
    runtimeLicenseSpdx: { type: "string" },
    runtimeClassification: {
      type: "string",
      enum: [
        "PERMISSIVE",
        "WEAK_COPYLEFT",
        "STRONG_COPYLEFT",
        "NETWORK_COPYLEFT",
        "COMMERCIAL_PROPRIETARY",
        "SOURCE_AVAILABLE"
      ]
    },
    adapterLicenseSpdx: { type: "string" },
    isolationMechanism: {
      type: "string",
      enum: [
        "NETWORK_RPC_REST",
        "NETWORK_RPC_GRPC",
        "PROCESS_CLI_SUBPROCESS",
        "SOCKET_IPC",
        "OCI_STANDARD_API"
      ]
    },
    isCleanRoomImplementation: { type: "boolean" },
    allowsRedistribution: { type: "boolean" },
    requiresAttributionNotice: { type: "boolean" },
    trademarkGuidelinesUrl: { type: "string" },
    thirdPartyNotices: {
      type: "array",
      items: {
        type: "object",
        required: ["componentName", "spdxId", "copyrightHolder"],
        properties: {
          componentName: { type: "string" },
          spdxId: { type: "string" },
          copyrightHolder: { type: "string" },
          sourceUrl: { type: "string" }
        }
      }
    },
    registeredAt: { type: "string" }
  }
} as const;

export const complianceAttributionPackageSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/compliance-attribution-package.json",
  title: "ComplianceAttributionPackage",
  type: "object",
  required: [
    "packageId",
    "benchmarkId",
    "scenarioId",
    "providerId",
    "generatedAt",
    "notices",
    "trademarks",
    "commercialTerms",
    "complianceGrade",
    "summaryMarkdown",
    "packageSignatureHex"
  ],
  properties: {
    packageId: { type: "string" },
    benchmarkId: { type: "string" },
    scenarioId: { type: "string" },
    providerId: { type: "string" },
    generatedAt: { type: "string" },
    notices: {
      type: "array",
      items: {
        type: "object",
        required: ["component", "spdxLicense", "copyrightHolders", "noticeText"],
        properties: {
          component: { type: "string" },
          spdxLicense: { type: "string" },
          copyrightHolders: { type: "array", items: { type: "string" } },
          noticeText: { type: "string" },
          sourceUrl: { type: "string" },
          licenseSha256: { type: "string" }
        }
      }
    },
    trademarks: {
      type: "array",
      items: {
        type: "object",
        required: ["mark", "owner", "usageContext", "disclaimerText"],
        properties: {
          mark: { type: "string" },
          owner: { type: "string" },
          usageContext: { type: "string" },
          disclaimerText: { type: "string" }
        }
      }
    },
    commercialTerms: {
      type: "object",
      required: [
        "commercialUseAllowed",
        "researchOnlyClause",
        "patentRetaliationClause",
        "redistributionPermitted"
      ],
      properties: {
        commercialUseAllowed: { type: "boolean" },
        researchOnlyClause: { type: "boolean" },
        patentRetaliationClause: { type: "boolean" },
        redistributionPermitted: { type: "boolean" },
        termsOfServiceUrl: { type: "string" },
        termsVersion: { type: "string" }
      }
    },
    complianceGrade: {
      type: "string",
      enum: [
        "FULLY_COMPLIANT",
        "COMPLIANT_WITH_NOTICES",
        "NON_COMMERCIAL_RESTRICTED",
        "NON_COMPLIANT_BLOCKED"
      ]
    },
    summaryMarkdown: { type: "string" },
    packageSignatureHex: { type: "string" }
  }
} as const;

export const canonicalProviderRegistryEntrySchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/canonical-provider-registry-entry.json",
  title: "CanonicalProviderRegistryEntry",
  type: "object",
  required: [
    "providerId",
    "displayName",
    "organization",
    "version",
    "releaseChannel",
    "deploymentMode",
    "endpoints",
    "capabilities",
    "licensing",
    "trustTier",
    "securityGrade",
    "pricing",
    "sla",
    "status",
    "consecutiveFailures",
    "tags",
    "registeredAt",
    "lastHeartbeatAt",
    "signatureHex"
  ],
  properties: {
    providerId: { type: "string" },
    displayName: { type: "string" },
    organization: { type: "string" },
    version: { type: "string" },
    releaseChannel: {
      type: "string",
      enum: ["STABLE", "BETA", "EXPERIMENTAL", "DEPRECATED"]
    },
    deploymentMode: {
      type: "string",
      enum: [
        "LOCAL_DAEMON",
        "DEDICATED_CLUSTER",
        "SERVERLESS_MICROVM",
        "MANAGED_MULTI_TENANT",
        "AIRGAPPED_ON_PREM",
        "MOCK_REPLAY"
      ]
    },
    endpoints: {
      type: "object",
      required: ["primaryUrl", "transport", "timeoutMs"],
      properties: {
        primaryUrl: { type: "string" },
        backupUrls: { type: "array", items: { type: "string" } },
        transport: {
          type: "string",
          enum: ["LOCAL_SOCKET", "HTTP_REST", "GRPC", "STDIO_SUBPROCESS"]
        },
        healthCheckUrl: { type: "string" },
        timeoutMs: { type: "integer", minimum: 100 }
      }
    },
    capabilities: { type: "object" },
    licensing: { type: "object" },
    trustTier: {
      type: "string",
      enum: ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    securityGrade: {
      type: "string",
      enum: ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    pricing: { type: "object" },
    sla: { type: "object" },
    status: {
      type: "string",
      enum: ["ONLINE", "DEGRADED", "MAINTENANCE", "OFFLINE", "QUARANTINED"]
    },
    consecutiveFailures: { type: "integer", minimum: 0 },
    tags: { type: "array", items: { type: "string" } },
    registeredAt: { type: "string" },
    lastHeartbeatAt: { type: "string" },
    signatureHex: { type: "string" }
  }
} as const;

export const holisticExecutionCostLedgerSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/holistic-execution-cost-ledger.json",
  title: "HolisticExecutionCostLedger",
  type: "object",
  required: [
    "runId",
    "benchmarkId",
    "scenarioId",
    "currency",
    "inference",
    "runtimeCompute",
    "browserGui",
    "gpu",
    "storage",
    "network",
    "tools",
    "evaluation",
    "totalGrossCostUsd",
    "grantSubsidiesUsd",
    "totalNetCostUsd",
    "timestamp",
    "ledgerSignatureHex"
  ],
  properties: {
    runId: { type: "string" },
    benchmarkId: { type: "string" },
    scenarioId: { type: "string" },
    currency: { type: "string", enum: ["USD"] },
    inference: {
      type: "object",
      required: [
        "modelId",
        "promptTokens",
        "completionTokens",
        "reasoningTokens",
        "cachedTokens",
        "costUsd"
      ],
      properties: {
        modelId: { type: "string" },
        promptTokens: { type: "integer", minimum: 0 },
        completionTokens: { type: "integer", minimum: 0 },
        reasoningTokens: { type: "integer", minimum: 0 },
        cachedTokens: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    runtimeCompute: {
      type: "object",
      required: [
        "providerId",
        "cpuCoreSeconds",
        "ramGibSeconds",
        "wallClockDurationMs",
        "coldBootSurchargeUsd",
        "costUsd"
      ],
      properties: {
        providerId: { type: "string" },
        cpuCoreSeconds: { type: "number", minimum: 0 },
        ramGibSeconds: { type: "number", minimum: 0 },
        wallClockDurationMs: { type: "integer", minimum: 0 },
        coldBootSurchargeUsd: { type: "number", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    browserGui: {
      type: "object",
      required: ["browserSessions", "activeDurationMs", "screenCaptureFrames", "costUsd"],
      properties: {
        browserSessions: { type: "integer", minimum: 0 },
        activeDurationMs: { type: "integer", minimum: 0 },
        screenCaptureFrames: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    gpu: {
      type: "object",
      required: ["gpuType", "allocatedGpuCount", "durationMs", "costUsd"],
      properties: {
        gpuType: { type: "string" },
        allocatedGpuCount: { type: "integer", minimum: 0 },
        durationMs: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    storage: {
      type: "object",
      required: ["diskAllocatedGb", "ioReadBytes", "ioWriteBytes", "snapshotCount", "costUsd"],
      properties: {
        diskAllocatedGb: { type: "number", minimum: 0 },
        ioReadBytes: { type: "number", minimum: 0 },
        ioWriteBytes: { type: "number", minimum: 0 },
        snapshotCount: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    network: {
      type: "object",
      required: ["ingressBytes", "egressBytes", "costUsd"],
      properties: {
        ingressBytes: { type: "number", minimum: 0 },
        egressBytes: { type: "number", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    tools: {
      type: "object",
      required: ["mcpToolCalls", "paidApiCalls", "costUsd"],
      properties: {
        mcpToolCalls: { type: "integer", minimum: 0 },
        paidApiCalls: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    evaluation: {
      type: "object",
      required: ["judgeModelId", "judgeTokens", "tckComputeMs", "costUsd"],
      properties: {
        judgeModelId: { type: "string" },
        judgeTokens: { type: "integer", minimum: 0 },
        tckComputeMs: { type: "integer", minimum: 0 },
        costUsd: { type: "number", minimum: 0 }
      }
    },
    totalGrossCostUsd: { type: "number", minimum: 0 },
    grantSubsidiesUsd: { type: "number", minimum: 0 },
    totalNetCostUsd: { type: "number", minimum: 0 },
    timestamp: { type: "string" },
    ledgerSignatureHex: { type: "string" }
  }
} as const;

export const verifiableBenchmarkExecutionReceiptSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/verifiable-benchmark-execution-receipt.json",
  title: "VerifiableBenchmarkExecutionReceipt",
  type: "object",
  required: [
    "identity",
    "provenance",
    "model",
    "artifacts",
    "observation",
    "financial",
    "compliance",
    "issuedAt",
    "issuerPublicKeyHex",
    "receiptDigestSha256",
    "signatureHex"
  ],
  properties: {
    identity: {
      type: "object",
      required: ["receiptId", "receiptVersion", "evaluationRunId", "benchmarkId", "scenarioId"],
      properties: {
        receiptId: { type: "string" },
        receiptVersion: { type: "string", enum: ["1.0.0"] },
        evaluationRunId: { type: "string" },
        benchmarkId: { type: "string" },
        scenarioId: { type: "string" }
      }
    },
    provenance: {
      type: "object",
      required: [
        "providerId",
        "providerVersion",
        "runtimeType",
        "environmentSpecHash",
        "imageDigest",
        "isolationMechanism",
        "reproducibilityTier"
      ],
      properties: {
        providerId: { type: "string" },
        providerVersion: { type: "string" },
        runtimeType: { type: "string" },
        environmentSpecHash: { type: "string" },
        imageDigest: { type: "string" },
        isolationMechanism: { type: "string" },
        reproducibilityTier: {
          type: "string",
          enum: [
            "HERMETIC_DETERMINISTIC",
            "PINNED_ENVIRONMENT",
            "BEST_EFFORT_REPRODUCIBLE",
            "NON_REPRODUCIBLE"
          ]
        },
        deterministicSeed: { type: "string" }
      }
    },
    model: {
      type: "object",
      required: ["modelId", "modelProvider"],
      properties: {
        modelId: { type: "string" },
        modelProvider: { type: "string" },
        agentFrameworkVersion: { type: "string" },
        temperature: { type: "number" },
        topP: { type: "number" }
      }
    },
    artifacts: {
      type: "object",
      required: ["filesMerkleRoot", "evidenceBundleDigest", "artifacts"],
      properties: {
        filesMerkleRoot: { type: "string" },
        evidenceBundleDigest: { type: "string" },
        artifacts: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "path", "sha256", "sizeBytes", "mimeType"],
            properties: {
              name: { type: "string" },
              path: { type: "string" },
              sha256: { type: "string" },
              sizeBytes: { type: "integer", minimum: 0 },
              mimeType: { type: "string" }
            }
          }
        }
      }
    },
    observation: {
      type: "object",
      required: ["behavioralChainHash", "eventCount", "outcome", "score", "metrics"],
      properties: {
        behavioralChainHash: { type: "string" },
        eventCount: { type: "integer", minimum: 0 },
        outcome: {
          type: "string",
          enum: ["PASSED", "FAILED", "PARTIAL", "TIMEOUT", "ERROR", "BUDGET_EXCEEDED"]
        },
        score: { type: "number" },
        metrics: { type: "object" }
      }
    },
    financial: {
      type: "object",
      required: ["costLedgerDigest", "totalGrossCostUsd", "totalNetCostUsd", "currency"],
      properties: {
        costLedgerDigest: { type: "string" },
        totalGrossCostUsd: { type: "number", minimum: 0 },
        totalNetCostUsd: { type: "number", minimum: 0 },
        currency: { type: "string", enum: ["USD"] },
        sponsorAttribution: { type: "string" }
      }
    },
    compliance: {
      type: "object",
      required: ["compliancePackageDigest", "complianceGrade"],
      properties: {
        compliancePackageDigest: { type: "string" },
        complianceGrade: {
          type: "string",
          enum: [
            "FULLY_COMPLIANT",
            "COMPLIANT_WITH_NOTICES",
            "NON_COMMERCIAL_RESTRICTED",
            "NON_COMPLIANT_BLOCKED"
          ]
        }
      }
    },
    issuedAt: { type: "string" },
    issuerPublicKeyHex: { type: "string" },
    receiptDigestSha256: { type: "string" },
    signatureHex: { type: "string" }
  }
} as const;

export const portableEvidencePackageSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/portable-evidence-package.json",
  title: "PortableEvidencePackage",
  type: "object",
  required: [
    "manifest",
    "environment",
    "behavioralTrace",
    "artifacts",
    "evaluations",
    "financial",
    "compliance",
    "receipt",
    "packageMerkleRoot",
    "packageSignatureHex"
  ],
  properties: {
    manifest: {
      type: "object",
      required: [
        "packageId",
        "packageVersion",
        "evaluationRunId",
        "benchmarkId",
        "scenarioId",
        "createdAt"
      ],
      properties: {
        packageId: { type: "string" },
        packageVersion: { type: "string", enum: ["1.0.0"] },
        evaluationRunId: { type: "string" },
        benchmarkId: { type: "string" },
        scenarioId: { type: "string" },
        createdAt: { type: "string" }
      }
    },
    environment: {
      type: "object",
      required: ["spec", "specHash"],
      properties: {
        spec: { type: "object" },
        specHash: { type: "string" }
      }
    },
    behavioralTrace: {
      type: "array",
      items: {
        type: "object",
        required: ["eventId", "seq", "stage", "timestamp", "agentId", "payload", "payloadDigest"],
        properties: {
          eventId: { type: "string" },
          seq: { type: "integer", minimum: 0 },
          stage: {
            type: "string",
            enum: [
              "CONTEXT",
              "INTERPRETATION",
              "DECISION",
              "ACTION",
              "RESULT",
              "CONSEQUENCE",
              "RECOVERY"
            ]
          },
          timestamp: { type: "string" },
          agentId: { type: "string" },
          actionType: { type: "string" },
          payload: { type: "object" },
          payloadDigest: { type: "string" }
        }
      }
    },
    artifacts: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "path", "sha256", "sizeBytes", "mimeType"],
        properties: {
          name: { type: "string" },
          path: { type: "string" },
          sha256: { type: "string" },
          sizeBytes: { type: "integer", minimum: 0 },
          mimeType: { type: "string" }
        }
      }
    },
    evaluations: {
      type: "array",
      items: {
        type: "object",
        required: [
          "evaluatorId",
          "evaluatorType",
          "metricName",
          "score",
          "maxScore",
          "rationale",
          "passed"
        ],
        properties: {
          evaluatorId: { type: "string" },
          evaluatorType: {
            type: "string",
            enum: ["DETERMINISTIC_ASSERTION", "LLM_JUDGE", "TCK_VERIFIER", "HUMAN_EXPERT"]
          },
          metricName: { type: "string" },
          score: { type: "number" },
          maxScore: { type: "number" },
          rationale: { type: "string" },
          passed: { type: "boolean" }
        }
      }
    },
    financial: { type: "object" },
    compliance: { type: "object" },
    receipt: { type: "object" },
    packageMerkleRoot: { type: "string" },
    packageSignatureHex: { type: "string" }
  }
} as const;

export const transitionAnalysisReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/transition-analysis-report.json",
  title: "TransitionAnalysisReport",
  type: "object",
  required: [
    "experimentId",
    "phenomenonType",
    "totalTrials",
    "observedRegimes",
    "dataPoints",
    "conclusions",
    "analyzedAt",
    "reportSignatureHex"
  ],
  properties: {
    experimentId: { type: "string" },
    phenomenonType: {
      type: "string",
      enum: [
        "ERROR_RECOVERY_PHASE_SHIFT",
        "CONTEXT_SATURATION_BREAKPOINT",
        "TOOL_COMPOSITION_THRESHOLD",
        "PERTURBATION_CLIFF",
        "RESOURCE_THROTTLING_REGIME"
      ]
    },
    totalTrials: { type: "integer", minimum: 1 },
    criticalThreshold: {
      type: "object",
      required: ["parameter", "thresholdValue", "confidence", "description"],
      properties: {
        parameter: { type: "string" },
        thresholdValue: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        description: { type: "string" }
      }
    },
    observedRegimes: {
      type: "array",
      items: {
        type: "object",
        required: [
          "regimeName",
          "parameterRange",
          "characteristicBehavior",
          "successRatePercentage"
        ],
        properties: {
          regimeName: { type: "string" },
          parameterRange: { type: "string" },
          characteristicBehavior: { type: "string" },
          successRatePercentage: { type: "number", minimum: 0, maximum: 100 }
        }
      }
    },
    dataPoints: {
      type: "array",
      items: {
        type: "object",
        required: [
          "paramValue",
          "trialIndex",
          "outcome",
          "actionCount",
          "recoveryEventsCount",
          "recoverySuccessRate",
          "loopCycleDetected",
          "wallClockDurationMs"
        ],
        properties: {
          paramValue: {},
          trialIndex: { type: "integer", minimum: 0 },
          outcome: {
            type: "string",
            enum: ["PASSED", "FAILED", "TIMEOUT", "ERROR"]
          },
          actionCount: { type: "integer", minimum: 0 },
          recoveryEventsCount: { type: "integer", minimum: 0 },
          recoverySuccessRate: { type: "number" },
          loopCycleDetected: { type: "boolean" },
          wallClockDurationMs: { type: "integer", minimum: 0 }
        }
      }
    },
    conclusions: { type: "array", items: { type: "string" } },
    analyzedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const semanticStressEvaluationReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/semantic-stress-evaluation-report.json",
  title: "SemanticStressEvaluationReport",
  type: "object",
  required: [
    "stressProfileId",
    "scenarioId",
    "agentId",
    "robustnessScore",
    "metrics",
    "resilienceGrade",
    "observedAnomalies",
    "analyzedAt",
    "reportSignatureHex"
  ],
  properties: {
    stressProfileId: { type: "string" },
    scenarioId: { type: "string" },
    agentId: { type: "string" },
    robustnessScore: { type: "number", minimum: 0, maximum: 1 },
    metrics: {
      type: "object",
      required: [
        "clarificationAttempts",
        "safetyChecksTriggered",
        "destructiveActionsAttempted",
        "destructiveActionsBlocked",
        "toolRetriesOnFault",
        "stateReconciliations",
        "finalTaskOutcome"
      ],
      properties: {
        clarificationAttempts: { type: "integer", minimum: 0 },
        safetyChecksTriggered: { type: "integer", minimum: 0 },
        destructiveActionsAttempted: { type: "integer", minimum: 0 },
        destructiveActionsBlocked: { type: "integer", minimum: 0 },
        toolRetriesOnFault: { type: "integer", minimum: 0 },
        stateReconciliations: { type: "integer", minimum: 0 },
        finalTaskOutcome: {
          type: "string",
          enum: ["PASSED", "FAILED", "HALTED_SAFETY_TRIPWIRE", "TIMEOUT"]
        }
      }
    },
    resilienceGrade: {
      type: "string",
      enum: ["TIER_1_HIGHLY_RESILIENT", "TIER_2_ADAPTIVE", "TIER_3_FRAGILE", "TIER_4_COLLAPSED"]
    },
    observedAnomalies: { type: "array", items: { type: "string" } },
    analyzedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const failureInjectionReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/failure-injection-report.json",
  title: "FailureInjectionReport",
  type: "object",
  required: [
    "planId",
    "scenarioId",
    "totalInjectedFaults",
    "recoveredFaultsCount",
    "meanTimeToRecoverySteps",
    "faultResilienceScore",
    "injectedEvents",
    "assessments",
    "analyzedAt",
    "reportSignatureHex"
  ],
  properties: {
    planId: { type: "string" },
    scenarioId: { type: "string" },
    totalInjectedFaults: { type: "integer", minimum: 0 },
    recoveredFaultsCount: { type: "integer", minimum: 0 },
    meanTimeToRecoverySteps: { type: "number", minimum: 0 },
    faultResilienceScore: { type: "number", minimum: 0, maximum: 1 },
    injectedEvents: {
      type: "array",
      items: {
        type: "object",
        required: [
          "faultEventId",
          "ruleId",
          "stepIndex",
          "faultType",
          "targetAction",
          "injectedOutcome",
          "timestamp"
        ],
        properties: {
          faultEventId: { type: "string" },
          ruleId: { type: "string" },
          stepIndex: { type: "integer", minimum: 0 },
          faultType: {
            type: "string",
            enum: [
              "CONTEXT_LOSS_TRUNCATION",
              "TOOL_RPC_ERROR",
              "NETWORK_PARTITION_LATENCY",
              "STALE_STATE_DRIFT",
              "CONTRADICTION_MUTATION",
              "PERMISSION_REVOCATION",
              "PARTIAL_RESULT_CORRUPTION"
            ]
          },
          targetAction: { type: "string" },
          injectedOutcome: { type: "object" },
          timestamp: { type: "string" }
        }
      }
    },
    assessments: {
      type: "array",
      items: {
        type: "object",
        required: [
          "faultEventId",
          "faultType",
          "recovered",
          "recoveryLatencySteps",
          "pathologicalLoopDetected"
        ],
        properties: {
          faultEventId: { type: "string" },
          faultType: {
            type: "string",
            enum: [
              "CONTEXT_LOSS_TRUNCATION",
              "TOOL_RPC_ERROR",
              "NETWORK_PARTITION_LATENCY",
              "STALE_STATE_DRIFT",
              "CONTRADICTION_MUTATION",
              "PERMISSION_REVOCATION",
              "PARTIAL_RESULT_CORRUPTION"
            ]
          },
          recovered: { type: "boolean" },
          recoveryLatencySteps: { type: "integer", minimum: 0 },
          recoveryActionType: { type: "string" },
          pathologicalLoopDetected: { type: "boolean" }
        }
      }
    },
    analyzedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const recoveryResilienceScorecardSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/recovery-resilience-scorecard.json",
  title: "RecoveryResilienceScorecard",
  type: "object",
  required: [
    "scenarioId",
    "agentId",
    "totalEpisodes",
    "successfulEpisodes",
    "recoverySuccessRate",
    "meanStepsToRecovery",
    "stagnationIndex",
    "diagnosticProbingDensity",
    "recoveryResilienceIndex",
    "recoveryGrade",
    "episodes",
    "evaluatedAt",
    "scorecardSignatureHex"
  ],
  properties: {
    scenarioId: { type: "string" },
    agentId: { type: "string" },
    totalEpisodes: { type: "integer", minimum: 0 },
    successfulEpisodes: { type: "integer", minimum: 0 },
    recoverySuccessRate: { type: "number", minimum: 0, maximum: 1 },
    meanStepsToRecovery: { type: "number", minimum: 0 },
    stagnationIndex: { type: "number", minimum: 0, maximum: 1 },
    diagnosticProbingDensity: { type: "number", minimum: 0, maximum: 1 },
    recoveryResilienceIndex: { type: "number", minimum: 0, maximum: 1 },
    recoveryGrade: {
      type: "string",
      enum: [
        "GRADE_A_SELF_HEALING",
        "GRADE_B_ADAPTIVE",
        "GRADE_C_TARDY",
        "GRADE_D_BRITTLE",
        "GRADE_F_STAGNANT"
      ]
    },
    episodes: {
      type: "array",
      items: {
        type: "object",
        required: [
          "episodeId",
          "triggerCategory",
          "triggerEventSeq",
          "latencySteps",
          "archetype",
          "isSuccessful",
          "stagnationCount",
          "diagnosticProbesCount"
        ],
        properties: {
          episodeId: { type: "string" },
          triggerCategory: {
            type: "string",
            enum: [
              "EXECUTION_ERROR",
              "FAILED_ASSERTION",
              "STALE_ENVIRONMENT_DRIFT",
              "INCORRECT_ASSUMPTION",
              "PERMISSION_DENIED",
              "TIMEOUT_EXHAUSTION"
            ]
          },
          triggerEventSeq: { type: "integer", minimum: 0 },
          resolvedEventSeq: { type: "integer", minimum: 0 },
          latencySteps: { type: "integer", minimum: 0 },
          archetype: {
            type: "string",
            enum: [
              "CORRECTIVE_REFACTOR",
              "EXPLORATORY_PROBING",
              "ENVIRONMENTAL_RECONCILIATION",
              "HYPOTHESIS_PIVOT",
              "GRACEFUL_DEGRADATION",
              "PATHOLOGICAL_STAGNATION"
            ]
          },
          isSuccessful: { type: "boolean" },
          stagnationCount: { type: "integer", minimum: 0 },
          diagnosticProbesCount: { type: "integer", minimum: 0 }
        }
      }
    },
    evaluatedAt: { type: "string" },
    scorecardSignatureHex: { type: "string" }
  }
} as const;

export const consequenceEvaluationReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/consequence-evaluation-report.json",
  title: "ConsequenceEvaluationReport",
  type: "object",
  required: [
    "scenarioId",
    "agentId",
    "totalConsequences",
    "recognitionRate",
    "attributionAccuracyRate",
    "remediationSuccessRate",
    "meanRecognitionLatencySteps",
    "secondaryCascadePenalty",
    "consequenceAwarenessIndex",
    "awarenessGrade",
    "events",
    "evaluatedAt",
    "reportSignatureHex"
  ],
  properties: {
    scenarioId: { type: "string" },
    agentId: { type: "string" },
    totalConsequences: { type: "integer", minimum: 0 },
    recognitionRate: { type: "number", minimum: 0, maximum: 1 },
    attributionAccuracyRate: { type: "number", minimum: 0, maximum: 1 },
    remediationSuccessRate: { type: "number", minimum: 0, maximum: 1 },
    meanRecognitionLatencySteps: { type: "number", minimum: 0 },
    secondaryCascadePenalty: { type: "number", minimum: 0 },
    consequenceAwarenessIndex: { type: "number", minimum: 0, maximum: 1 },
    awarenessGrade: {
      type: "string",
      enum: [
        "TIER_1_SYSTEMIC_AWARE",
        "TIER_2_REMEDIATING",
        "TIER_3_SYMPTOM_FOCUSED",
        "TIER_4_BLIND_CASCADE"
      ]
    },
    events: {
      type: "array",
      items: {
        type: "object",
        required: [
          "eventId",
          "consequenceId",
          "manifestedStep",
          "observableSymptom",
          "recognized",
          "recognitionLatencySteps",
          "correctlyAttributed",
          "remediationSuccessful",
          "secondaryConsequencesCount"
        ],
        properties: {
          eventId: { type: "string" },
          consequenceId: { type: "string" },
          manifestedStep: { type: "integer", minimum: 0 },
          observableSymptom: { type: "string" },
          recognized: { type: "boolean" },
          recognitionLatencySteps: { type: "integer", minimum: 0 },
          correctlyAttributed: { type: "boolean" },
          attributedActionStep: { type: "integer", minimum: 0 },
          remediationSuccessful: { type: "boolean" },
          secondaryConsequencesCount: { type: "integer", minimum: 0 }
        }
      }
    },
    evaluatedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const longHorizonEvaluationReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/long-horizon-evaluation-report.json",
  title: "LongHorizonEvaluationReport",
  type: "object",
  required: [
    "scenarioId",
    "agentId",
    "totalExecutedSteps",
    "completedMilestonesCount",
    "totalMilestonesCount",
    "milestoneCompletionRate",
    "goalConvergenceScore",
    "memoryCoherenceScore",
    "budgetEfficiencyScore",
    "longHorizonResilienceIndex",
    "horizonGrade",
    "milestones",
    "evaluatedAt",
    "reportSignatureHex"
  ],
  properties: {
    scenarioId: { type: "string" },
    agentId: { type: "string" },
    totalExecutedSteps: { type: "integer", minimum: 0 },
    completedMilestonesCount: { type: "integer", minimum: 0 },
    totalMilestonesCount: { type: "integer", minimum: 0 },
    milestoneCompletionRate: { type: "number", minimum: 0, maximum: 1 },
    goalConvergenceScore: { type: "number", minimum: 0, maximum: 1 },
    memoryCoherenceScore: { type: "number", minimum: 0, maximum: 1 },
    budgetEfficiencyScore: { type: "number", minimum: 0, maximum: 1 },
    longHorizonResilienceIndex: { type: "number", minimum: 0, maximum: 1 },
    horizonGrade: {
      type: "string",
      enum: [
        "GRADE_LH1_AUTONOMOUS_SCALE",
        "GRADE_LH2_MILESTONE_COMPLETING",
        "GRADE_LH3_TARDY_DEGRADED",
        "GRADE_LH4_HORIZON_COLLAPSED"
      ]
    },
    milestones: {
      type: "array",
      items: {
        type: "object",
        required: [
          "milestoneId",
          "phase",
          "startStep",
          "durationSteps",
          "achieved",
          "tokensUsed",
          "errorsEncountered",
          "recoveryCount"
        ],
        properties: {
          milestoneId: { type: "string" },
          phase: {
            type: "string",
            enum: [
              "DISCOVERY_AND_RECON",
              "ARCHITECTURAL_PLANNING",
              "SCAFFOLD_AND_BOOTSTRAP",
              "INCREMENTAL_IMPLEMENTATION",
              "INTEGRATION_AND_TESTING",
              "VERIFICATION_AND_FINALIZE"
            ]
          },
          startStep: { type: "integer", minimum: 0 },
          completedStep: { type: "integer", minimum: 0 },
          durationSteps: { type: "integer", minimum: 0 },
          achieved: { type: "boolean" },
          tokensUsed: { type: "integer", minimum: 0 },
          errorsEncountered: { type: "integer", minimum: 0 },
          recoveryCount: { type: "integer", minimum: 0 }
        }
      }
    },
    evaluatedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const sandboxBenchmarkDSLSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-benchmark-dsl.json",
  title: "SandboxBenchmarkDSL",
  type: "object",
  required: ["dslVersion", "metadata", "environment", "actors", "tools", "assertions", "lifecycle"],
  properties: {
    dslVersion: { type: "string", const: "1.0.0" },
    metadata: {
      type: "object",
      required: [
        "benchmarkId",
        "scenarioId",
        "version",
        "title",
        "description",
        "tags",
        "license",
        "author"
      ],
      properties: {
        benchmarkId: { type: "string" },
        scenarioId: { type: "string" },
        version: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        license: {
          type: "string",
          enum: ["MIT", "Apache-2.0", "BSD-3-Clause", "CC-BY-4.0", "Proprietary"]
        },
        author: { type: "string" }
      }
    },
    environment: {
      type: "object",
      required: ["runtimeType", "baseImage", "resources", "networkPolicy"],
      properties: {
        runtimeType: { type: "string", enum: ["container", "microvm", "local_process"] },
        baseImage: { type: "string" },
        resources: {
          type: "object",
          required: ["cpuCores", "memoryMb", "diskGb"],
          properties: {
            cpuCores: { type: "number", minimum: 0.5 },
            memoryMb: { type: "integer", minimum: 256 },
            diskGb: { type: "integer", minimum: 1 },
            gpuCount: { type: "integer", minimum: 0 }
          }
        },
        networkPolicy: { type: "string", enum: ["ISOLATED", "EGRESS_ALLOWLIST", "FULL_ACCESS"] },
        egressAllowlist: { type: "array", items: { type: "string" } },
        envVars: { type: "object", additionalProperties: { type: "string" } },
        preinstalledPackages: { type: "array", items: { type: "string" } },
        volumeMounts: {
          type: "array",
          items: {
            type: "object",
            required: ["sourcePath", "targetMountPath", "readOnly"],
            properties: {
              sourcePath: { type: "string" },
              targetMountPath: { type: "string" },
              readOnly: { type: "boolean" }
            }
          }
        }
      }
    },
    actors: {
      type: "array",
      items: {
        type: "object",
        required: ["actorId", "role", "allowedTools", "permissionLevel"],
        properties: {
          actorId: { type: "string" },
          role: { type: "string", enum: ["PRIMARY_AGENT", "EVALUATOR", "MOCK_PEER", "USER_PROXY"] },
          allowedTools: { type: "array", items: { type: "string" } },
          permissionLevel: {
            type: "string",
            enum: ["SANDBOX_USER", "SUDO_ROOT", "RESTRICTED_READONLY"]
          }
        }
      }
    },
    tools: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "type", "description", "timeoutMs"],
        properties: {
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["BASH", "FILE_SYSTEM", "HTTP_API", "BROWSER", "MCP_SERVER"]
          },
          description: { type: "string" },
          timeoutMs: { type: "integer", minimum: 100 },
          config: { type: "object" }
        }
      }
    },
    perturbations: {
      type: "array",
      items: {
        type: "object",
        required: ["perturbationId", "mode", "triggerStep", "parameters"],
        properties: {
          perturbationId: { type: "string" },
          mode: {
            type: "string",
            enum: [
              "CONTEXT_LOSS_TRUNCATION",
              "TOOL_RPC_ERROR",
              "NETWORK_PARTITION_LATENCY",
              "STALE_STATE_DRIFT",
              "CONTRADICTION_MUTATION",
              "PERMISSION_REVOCATION",
              "PARTIAL_RESULT_CORRUPTION"
            ]
          },
          triggerStep: { type: "integer", minimum: 0 },
          parameters: { type: "object" }
        }
      }
    },
    milestones: {
      type: "array",
      items: {
        type: "object",
        required: ["milestoneId", "phase", "description", "stepBudget", "requiredArtifacts"],
        properties: {
          milestoneId: { type: "string" },
          phase: {
            type: "string",
            enum: [
              "DISCOVERY_AND_RECON",
              "ARCHITECTURAL_PLANNING",
              "SCAFFOLD_AND_BOOTSTRAP",
              "INCREMENTAL_IMPLEMENTATION",
              "INTEGRATION_AND_TESTING",
              "VERIFICATION_AND_FINALIZE"
            ]
          },
          description: { type: "string" },
          stepBudget: { type: "integer", minimum: 1 },
          requiredArtifacts: { type: "array", items: { type: "string" } }
        }
      }
    },
    assertions: {
      type: "array",
      items: {
        type: "object",
        required: ["assertionId", "type", "params", "weight"],
        properties: {
          assertionId: { type: "string" },
          targetStep: { type: "integer", minimum: 0 },
          type: {
            type: "string",
            enum: [
              "EXIT_CODE_EQUALS",
              "FILE_EXISTS",
              "FILE_CONTAINS_REGEX",
              "COMMAND_OUTPUT_MATCHES",
              "TEST_SUITE_PASSES",
              "RRI_THRESHOLD",
              "CAI_THRESHOLD"
            ]
          },
          params: { type: "object" },
          weight: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    },
    lifecycle: {
      type: "object",
      required: [
        "setupCommands",
        "maxDurationSeconds",
        "totalStepBudget",
        "retryBudget",
        "teardownCommands"
      ],
      properties: {
        setupCommands: { type: "array", items: { type: "string" } },
        maxDurationSeconds: { type: "integer", minimum: 1 },
        totalStepBudget: { type: "integer", minimum: 1 },
        retryBudget: { type: "integer", minimum: 0 },
        teardownCommands: { type: "array", items: { type: "string" } }
      }
    },
    extensions: {
      type: "object",
      additionalProperties: { type: "object" }
    }
  }
} as const;

export const runRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/execution-api-run-record.json",
  title: "RunRecord",
  type: "object",
  required: [
    "runId",
    "scenarioId",
    "agentId",
    "providerId",
    "status",
    "createdAt",
    "provenanceHash",
    "isReplay"
  ],
  properties: {
    runId: { type: "string" },
    scenarioId: { type: "string" },
    agentId: { type: "string" },
    providerId: { type: "string" },
    status: {
      type: "string",
      enum: [
        "PENDING",
        "VALIDATING",
        "PROVISIONING",
        "RUNNING",
        "PAUSED",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "CLEANED_UP"
      ]
    },
    createdAt: { type: "string" },
    startedAt: { type: "string" },
    completedAt: { type: "string" },
    cancellationReason: { type: "string" },
    errorDetails: { type: "string" },
    costEstimateUsd: { type: "number", minimum: 0 },
    provenanceHash: { type: "string" },
    isReplay: { type: "boolean" },
    sourceRunId: { type: "string" }
  }
} as const;

export const cliRunResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/cli-runner-result.json",
  title: "CLIRunResult",
  type: "object",
  required: [
    "exitCode",
    "runId",
    "scenarioId",
    "providerUsed",
    "artifactsGenerated",
    "totalExecutionTimeMs",
    "scorecardSummary",
    "manifestDigest",
    "executedAt"
  ],
  properties: {
    exitCode: { type: "integer" },
    runId: { type: "string" },
    scenarioId: { type: "string" },
    providerUsed: { type: "string" },
    artifactsGenerated: { type: "array", items: { type: "string" } },
    totalExecutionTimeMs: { type: "number", minimum: 0 },
    scorecardSummary: {
      type: "object",
      required: ["milestoneRate", "resilienceGrade", "awarenessGrade"],
      properties: {
        milestoneRate: { type: "number", minimum: 0, maximum: 1 },
        resilienceGrade: { type: "string" },
        awarenessGrade: { type: "string" }
      }
    },
    manifestDigest: { type: "string" },
    executedAt: { type: "string" }
  }
} as const;

export const routingDecisionRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/web-api-routing-decision.json",
  title: "RoutingDecisionRecord",
  type: "object",
  required: [
    "routingId",
    "scenarioId",
    "selectedProviderId",
    "selectedEndpointUrl",
    "policyApplied",
    "candidatesEvaluated",
    "routedAt",
    "decisionSignatureHex"
  ],
  properties: {
    routingId: { type: "string" },
    scenarioId: { type: "string" },
    selectedProviderId: { type: "string" },
    selectedEndpointUrl: { type: "string" },
    fallbackProviderId: { type: "string" },
    fallbackEndpointUrl: { type: "string" },
    policyApplied: { type: "object" },
    candidatesEvaluated: {
      type: "array",
      items: {
        type: "object",
        required: [
          "providerId",
          "capabilityMatch",
          "policyCompliant",
          "estimatedCostPerMinute",
          "healthScore",
          "compositeRank"
        ],
        properties: {
          providerId: { type: "string" },
          capabilityMatch: { type: "boolean" },
          policyCompliant: { type: "boolean" },
          estimatedCostPerMinute: { type: "number", minimum: 0 },
          healthScore: { type: "number", minimum: 0, maximum: 1 },
          compositeRank: { type: "number" },
          rejectionReason: { type: "string" }
        }
      }
    },
    routedAt: { type: "string" },
    decisionSignatureHex: { type: "string" }
  }
} as const;

export const providerConformanceCertificateSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-conformance-certificate.json",
  title: "ProviderConformanceCertificate",
  type: "object",
  required: [
    "providerId",
    "adapterVersion",
    "passedChecks",
    "failedChecks",
    "isCertified",
    "certifiedAt",
    "certificateSignatureHex"
  ],
  properties: {
    providerId: { type: "string" },
    adapterVersion: { type: "string" },
    passedChecks: { type: "array", items: { type: "string" } },
    failedChecks: { type: "array", items: { type: "string" } },
    isCertified: { type: "boolean" },
    certifiedAt: { type: "string" },
    certificateSignatureHex: { type: "string" }
  }
} as const;

export const providerCertificationScorecardSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-certification-scorecard.json",
  title: "ProviderCertificationScorecard",
  type: "object",
  required: [
    "certificateId",
    "providerId",
    "providerVersion",
    "assignedTier",
    "compositeScore",
    "dimensions",
    "declaredLimitations",
    "certifiedAt",
    "expiresAt",
    "auditorSignatureHex"
  ],
  properties: {
    certificateId: { type: "string" },
    providerId: { type: "string" },
    providerVersion: { type: "string" },
    assignedTier: {
      type: "string",
      enum: [
        "TIER_0_UNVERIFIED",
        "TIER_1_CONFORMANCE_VERIFIED",
        "TIER_2_HERMETIC_CERTIFIED",
        "TIER_3_ENTERPRISE_AUDITED"
      ]
    },
    compositeScore: { type: "number", minimum: 0, maximum: 1 },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        required: ["dimension", "score", "passed", "findings", "evidenceDigest"],
        properties: {
          dimension: {
            type: "string",
            enum: [
              "CONTRACT_CONFORMANCE",
              "REPRODUCIBILITY",
              "SECURITY_ISOLATION",
              "OBSERVABILITY_FIDELITY",
              "PROVENANCE_INTEGRITY",
              "DECLARED_LIMITATIONS"
            ]
          },
          score: { type: "number", minimum: 0, maximum: 1 },
          passed: { type: "boolean" },
          findings: { type: "array", items: { type: "string" } },
          evidenceDigest: { type: "string" }
        }
      }
    },
    declaredLimitations: { type: "array", items: { type: "string" } },
    certifiedAt: { type: "string" },
    expiresAt: { type: "string" },
    auditorSignatureHex: { type: "string" }
  }
} as const;

export const providerSecurityAuditReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-security-audit-report.json",
  title: "ProviderSecurityAuditReport",
  type: "object",
  required: [
    "auditId",
    "providerId",
    "providerVersion",
    "securityPostureGrade",
    "totalProbes",
    "passedProbes",
    "criticalVulnerabilitiesCount",
    "probes",
    "auditedAt",
    "auditSignatureHex"
  ],
  properties: {
    auditId: { type: "string" },
    providerId: { type: "string" },
    providerVersion: { type: "string" },
    securityPostureGrade: {
      type: "string",
      enum: [
        "GRADE_A_HARDENED_ISOLATED",
        "GRADE_B_CONTAINED",
        "GRADE_C_PERMISSIVE",
        "GRADE_F_VULNERABLE"
      ]
    },
    totalProbes: { type: "integer", minimum: 0 },
    passedProbes: { type: "integer", minimum: 0 },
    criticalVulnerabilitiesCount: { type: "integer", minimum: 0 },
    probes: {
      type: "array",
      items: {
        type: "object",
        required: [
          "probeId",
          "category",
          "severity",
          "passed",
          "attackPayload",
          "observedResponse",
          "mitigationVerified",
          "evidenceHash"
        ],
        properties: {
          probeId: { type: "string" },
          category: {
            type: "string",
            enum: [
              "FILESYSTEM_CONTAINMENT",
              "NETWORK_EGRESS_POLICY",
              "CREDENTIAL_ISOLATION",
              "RESOURCE_GOVERNANCE",
              "PROCESS_PRIVILEGE_CONTAINMENT",
              "CLEANUP_EPHEMERALITY",
              "EVIDENCE_TAMPER_RESISTANCE"
            ]
          },
          severity: {
            type: "string",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]
          },
          passed: { type: "boolean" },
          attackPayload: { type: "string" },
          observedResponse: { type: "string" },
          mitigationVerified: { type: "boolean" },
          evidenceHash: { type: "string" }
        }
      }
    },
    auditedAt: { type: "string" },
    auditSignatureHex: { type: "string" }
  }
} as const;

export const integrityVerificationReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/benchmark-integrity-report.json",
  title: "IntegrityVerificationReport",
  type: "object",
  required: [
    "auditId",
    "scenarioId",
    "runId",
    "integrityGrade",
    "manifestIntact",
    "traceSequenceIntact",
    "scoringRubricIntact",
    "providerAttestationIntact",
    "violations",
    "auditedAt",
    "auditSignatureHex"
  ],
  properties: {
    auditId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    integrityGrade: {
      type: "string",
      enum: ["SEALED_VALID", "TAMPERING_DETECTED", "PROVENANCE_BROKEN"]
    },
    manifestIntact: { type: "boolean" },
    traceSequenceIntact: { type: "boolean" },
    scoringRubricIntact: { type: "boolean" },
    providerAttestationIntact: { type: "boolean" },
    violations: { type: "array", items: { type: "string" } },
    auditedAt: { type: "string" },
    auditSignatureHex: { type: "string" }
  }
} as const;

export const antiGamingScorecardSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/anti-gaming-scorecard.json",
  title: "AntiGamingScorecard",
  type: "object",
  required: [
    "scorecardId",
    "scenarioId",
    "runId",
    "gamingRiskScore",
    "authenticityIndex",
    "classification",
    "anomalies",
    "evaluatedAt",
    "auditorSignatureHex"
  ],
  properties: {
    scorecardId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    gamingRiskScore: { type: "number", minimum: 0, maximum: 1 },
    authenticityIndex: { type: "number", minimum: 0, maximum: 1 },
    classification: {
      type: "string",
      enum: [
        "AUTHENTIC_REASONED",
        "SUSPICIOUS_SHORTCUTS",
        "PROBABLE_MEMORIZATION",
        "CONFIRMED_GAMING"
      ]
    },
    anomalies: {
      type: "array",
      items: {
        type: "object",
        required: [
          "anomalyId",
          "type",
          "severity",
          "stepIndex",
          "description",
          "confidence",
          "evidenceDigest"
        ],
        properties: {
          anomalyId: { type: "string" },
          type: {
            type: "string",
            enum: [
              "MEMORIZATION_INSTANT_SOLVE",
              "SHORTCUT_UNVERIFIED_MUTATION",
              "PATTERN_MATCH_EXPLOITATION",
              "ENVIRONMENT_OVERFITTING",
              "ASSERTION_TAMPERING_ATTEMPT",
              "SYNTACTIC_COPY_PASTE"
            ]
          },
          severity: {
            type: "string",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
          },
          stepIndex: { type: "integer", minimum: 1 },
          description: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidenceDigest: { type: "string" }
        }
      }
    },
    evaluatedAt: { type: "string" },
    auditorSignatureHex: { type: "string" }
  }
} as const;

export const independentObservationBundleSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/independent-observation-bundle.json",
  title: "IndependentObservationBundle",
  type: "object",
  required: [
    "bundleId",
    "scenarioId",
    "runId",
    "totalObservations",
    "groundTruthCount",
    "discrepancyCount",
    "overallObservationTrustScore",
    "observations",
    "auditedAt",
    "observerSignatureHex"
  ],
  properties: {
    bundleId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    totalObservations: { type: "integer", minimum: 0 },
    groundTruthCount: { type: "integer", minimum: 0 },
    discrepancyCount: { type: "integer", minimum: 0 },
    overallObservationTrustScore: { type: "number", minimum: 0, maximum: 1 },
    observations: {
      type: "array",
      items: {
        type: "object",
        required: [
          "observationId",
          "stepIndex",
          "stage",
          "sourceType",
          "trustConfidence",
          "crossVerificationStatus",
          "rawObservedData",
          "timestamp",
          "observationDigest"
        ],
        properties: {
          observationId: { type: "string" },
          stepIndex: { type: "integer", minimum: 1 },
          stage: {
            type: "string",
            enum: [
              "Context",
              "Interpretation",
              "Decision",
              "Action",
              "Result",
              "Consequence",
              "Recovery"
            ]
          },
          sourceType: {
            type: "string",
            enum: [
              "HOST_KERNEL_EBPF",
              "SOCKET_PTY_MIRROR",
              "NETWORK_BRIDGE_TAP",
              "FILESYSTEM_SNAPSHOT_DIFF",
              "PROVIDER_ADAPTER_API",
              "AGENT_SELF_REPORT"
            ]
          },
          trustConfidence: { type: "number", minimum: 0, maximum: 1 },
          crossVerificationStatus: {
            type: "string",
            enum: ["VERIFIED_BY_HOST", "DISCREPANCY_DETECTED", "UNVERIFIABLE_CLAIM"]
          },
          rawObservedData: { type: "object" },
          providerClaimDiscrepancy: { type: "string" },
          timestamp: { type: "string" },
          observationDigest: { type: "string" }
        }
      }
    },
    auditedAt: { type: "string" },
    observerSignatureHex: { type: "string" }
  }
} as const;

export const comprehensiveEvidenceProvenanceGraphSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/evidence-provenance-graph.json",
  title: "ComprehensiveEvidenceProvenanceGraph",
  type: "object",
  required: [
    "graphId",
    "scenarioId",
    "runId",
    "benchmark",
    "model",
    "environment",
    "transformations",
    "artifacts",
    "evaluator",
    "graphMerkleRoot",
    "sealedAt",
    "lineageSignatureHex"
  ],
  properties: {
    graphId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    benchmark: {
      type: "object",
      required: ["scenarioId", "manifestDigest", "dslVersion"],
      properties: {
        scenarioId: { type: "string" },
        manifestDigest: { type: "string" },
        dslVersion: { type: "string" },
        gitCommitSha: { type: "string" }
      }
    },
    model: {
      type: "object",
      required: ["modelId", "modelVersion", "agentArchitecture", "promptDigest", "temperature"],
      properties: {
        modelId: { type: "string" },
        modelVersion: { type: "string" },
        agentArchitecture: { type: "string" },
        promptDigest: { type: "string" },
        temperature: { type: "number" }
      }
    },
    environment: {
      type: "object",
      required: ["providerId", "providerVersion", "imageDigest", "hostPlatform", "kernelVersion"],
      properties: {
        providerId: { type: "string" },
        providerVersion: { type: "string" },
        imageDigest: { type: "string" },
        hostPlatform: { type: "string" },
        kernelVersion: { type: "string" }
      }
    },
    transformations: {
      type: "array",
      items: {
        type: "object",
        required: ["transformationId", "operation", "inputDigest", "outputDigest", "appliedAt"],
        properties: {
          transformationId: { type: "string" },
          operation: { type: "string" },
          inputDigest: { type: "string" },
          outputDigest: { type: "string" },
          appliedAt: { type: "string" }
        }
      }
    },
    artifacts: {
      type: "array",
      items: {
        type: "object",
        required: ["artifactId", "path", "sha256", "sizeBytes", "sourceStep", "generatedBy"],
        properties: {
          artifactId: { type: "string" },
          path: { type: "string" },
          sha256: { type: "string" },
          sizeBytes: { type: "integer", minimum: 0 },
          sourceStep: { type: "integer", minimum: 1 },
          generatedBy: { type: "string" }
        }
      }
    },
    evaluator: {
      type: "object",
      required: ["evaluatorId", "evaluatorVersion", "rubricDigest", "evaluatedAt"],
      properties: {
        evaluatorId: { type: "string" },
        evaluatorVersion: { type: "string" },
        rubricDigest: { type: "string" },
        evaluatedAt: { type: "string" }
      }
    },
    graphMerkleRoot: { type: "string" },
    sealedAt: { type: "string" },
    lineageSignatureHex: { type: "string" }
  }
} as const;

export const crossModelProviderComparisonReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/cross-comparison-report.json",
  title: "CrossModelProviderComparisonReport",
  type: "object",
  required: [
    "comparisonId",
    "benchmarkId",
    "scenarioId",
    "totalRuns",
    "runs",
    "providerEffects",
    "rankings",
    "auditedAt",
    "comparisonSignatureHex"
  ],
  properties: {
    comparisonId: { type: "string" },
    benchmarkId: { type: "string" },
    scenarioId: { type: "string" },
    totalRuns: { type: "integer", minimum: 0 },
    runs: {
      type: "array",
      items: {
        type: "object",
        required: [
          "runId",
          "modelId",
          "providerId",
          "rawScore",
          "stepCount",
          "durationMs",
          "toolErrorCount"
        ],
        properties: {
          runId: { type: "string" },
          modelId: { type: "string" },
          providerId: { type: "string" },
          rawScore: { type: "number", minimum: 0, maximum: 1 },
          stepCount: { type: "integer", minimum: 0 },
          durationMs: { type: "integer", minimum: 0 },
          toolErrorCount: { type: "integer", minimum: 0 }
        }
      }
    },
    providerEffects: {
      type: "array",
      items: {
        type: "object",
        required: ["providerId", "meanLatencyMs", "environmentPenaltyFactor", "varianceScore"],
        properties: {
          providerId: { type: "string" },
          meanLatencyMs: { type: "integer", minimum: 0 },
          environmentPenaltyFactor: { type: "number" },
          varianceScore: { type: "number" }
        }
      }
    },
    rankings: {
      type: "array",
      items: {
        type: "object",
        required: [
          "rank",
          "modelId",
          "rawMeanScore",
          "normalizedScore",
          "providerVarianceSensitivity",
          "confidenceInterval",
          "distinctionSignificance"
        ],
        properties: {
          rank: { type: "integer", minimum: 1 },
          modelId: { type: "string" },
          rawMeanScore: { type: "number", minimum: 0, maximum: 1 },
          normalizedScore: { type: "number", minimum: 0, maximum: 1 },
          providerVarianceSensitivity: { type: "number", minimum: 0, maximum: 1 },
          confidenceInterval: {
            type: "object",
            required: ["low", "high"],
            properties: {
              low: { type: "number", minimum: 0, maximum: 1 },
              high: { type: "number", minimum: 0, maximum: 1 }
            }
          },
          distinctionSignificance: {
            type: "string",
            enum: ["STATISTICALLY_SIGNIFICANT", "WITHIN_VARIANCE_MARGIN"]
          }
        }
      }
    },
    auditedAt: { type: "string" },
    comparisonSignatureHex: { type: "string" }
  }
} as const;

export const dashboardStateSnapshotSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/observability-dashboard-snapshot.json",
  title: "DashboardStateSnapshot",
  type: "object",
  required: [
    "dashboardId",
    "scenarioId",
    "runId",
    "viewMode",
    "lifecycleStatus",
    "currentStep",
    "totalSteps",
    "activeStage",
    "elapsedMs",
    "totalCostUsd",
    "authenticityClassification",
    "integrityGrade",
    "terminalBufferPreview",
    "recentEventsCount",
    "resourceUtilization",
    "renderedAt",
    "snapshotDigest"
  ],
  properties: {
    dashboardId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    viewMode: {
      type: "string",
      enum: ["LIVE_STREAMING", "POST_RUN_FORENSIC_REPLAY"]
    },
    lifecycleStatus: { type: "string" },
    currentStep: { type: "integer", minimum: 0 },
    totalSteps: { type: "integer", minimum: 0 },
    activeStage: {
      type: "string",
      enum: ["Context", "Interpretation", "Decision", "Action", "Result", "Consequence", "Recovery"]
    },
    elapsedMs: { type: "integer", minimum: 0 },
    totalCostUsd: { type: "number", minimum: 0 },
    authenticityClassification: { type: "string" },
    integrityGrade: { type: "string" },
    terminalBufferPreview: { type: "string" },
    recentEventsCount: { type: "integer", minimum: 0 },
    resourceUtilization: {
      type: "object",
      required: ["cpuPercent", "memoryMbUsed"],
      properties: {
        cpuPercent: { type: "number", minimum: 0, maximum: 100 },
        memoryMbUsed: { type: "number", minimum: 0 }
      }
    },
    renderedAt: { type: "string" },
    snapshotDigest: { type: "string" }
  }
} as const;

export const canonicalBenchmarkReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/canonical-benchmark-report.json",
  title: "CanonicalBenchmarkReport",
  type: "object",
  required: [
    "reportId",
    "scenarioId",
    "runId",
    "verdict",
    "compositeScore",
    "methodology",
    "behavioralFindings",
    "integrityAndTrust",
    "costAccounting",
    "provenance",
    "limitations",
    "generatedAt",
    "reportSignatureHex"
  ],
  properties: {
    reportId: { type: "string" },
    scenarioId: { type: "string" },
    runId: { type: "string" },
    verdict: {
      type: "string",
      enum: ["PASSED", "FAILED", "PARTIAL", "ERROR"]
    },
    compositeScore: { type: "number", minimum: 0, maximum: 1 },
    methodology: {
      type: "object",
      required: [
        "benchmarkId",
        "dslVersion",
        "providerId",
        "imageDigest",
        "networkPolicy",
        "totalStepBudget"
      ],
      properties: {
        benchmarkId: { type: "string" },
        dslVersion: { type: "string" },
        providerId: { type: "string" },
        imageDigest: { type: "string" },
        networkPolicy: { type: "string" },
        totalStepBudget: { type: "integer", minimum: 1 }
      }
    },
    behavioralFindings: {
      type: "object",
      required: [
        "longHorizonResilienceIndex",
        "consequenceAttributionIndex",
        "recoveryResilienceIndex",
        "detectedTransitions"
      ],
      properties: {
        longHorizonResilienceIndex: { type: "number", minimum: 0, maximum: 1 },
        consequenceAttributionIndex: { type: "number", minimum: 0, maximum: 1 },
        recoveryResilienceIndex: { type: "number", minimum: 0, maximum: 1 },
        detectedTransitions: { type: "integer", minimum: 0 }
      }
    },
    integrityAndTrust: {
      type: "object",
      required: ["integrityGrade", "authenticityClassification", "observerTrustScore"],
      properties: {
        integrityGrade: { type: "string" },
        authenticityClassification: { type: "string" },
        observerTrustScore: { type: "number", minimum: 0, maximum: 1 }
      }
    },
    costAccounting: {
      type: "object",
      required: ["totalCostUsd", "receiptSignature"],
      properties: {
        totalCostUsd: { type: "number", minimum: 0 },
        receiptSignature: { type: "string" }
      }
    },
    provenance: {
      type: "object",
      required: ["graphMerkleRoot", "evidenceDigest"],
      properties: {
        graphMerkleRoot: { type: "string" },
        evidenceDigest: { type: "string" }
      }
    },
    limitations: {
      type: "array",
      items: { type: "string" }
    },
    generatedAt: { type: "string" },
    reportSignatureHex: { type: "string" }
  }
} as const;

export const sandboxPhaseSecurityAuditReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-phase-security-audit-report.json",
  title: "SandboxPhaseSecurityAuditReport",
  type: "object",
  required: [
    "auditId",
    "phase",
    "auditedVersion",
    "overallStatus",
    "threatVectorsTested",
    "threatsBlocked",
    "zeroDaysFound",
    "threatResults",
    "ecosystemHardeningScore",
    "auditedAt",
    "securityAuditorSignatureHex"
  ],
  properties: {
    auditId: { type: "string" },
    phase: {
      type: "string",
      enum: ["SANDBOX_PHASE"]
    },
    auditedVersion: { type: "string" },
    overallStatus: {
      type: "string",
      enum: ["AUDIT_PASSED_HARDENED", "CONDITIONAL_PASS", "SECURITY_DEFECTS_FOUND"]
    },
    threatVectorsTested: { type: "integer", minimum: 1 },
    threatsBlocked: { type: "integer", minimum: 0 },
    zeroDaysFound: { type: "integer", minimum: 0 },
    threatResults: {
      type: "array",
      items: {
        type: "object",
        required: [
          "threatId",
          "threatCategory",
          "attackVector",
          "redTeamPayload",
          "defenseMechanism",
          "status",
          "verificationDigest"
        ],
        properties: {
          threatId: { type: "string" },
          threatCategory: { type: "string" },
          attackVector: { type: "string" },
          redTeamPayload: { type: "string" },
          defenseMechanism: { type: "string" },
          status: {
            type: "string",
            enum: ["MITIGATED", "BLOCKED", "FLAGGED_AND_DISQUALIFIED"]
          },
          verificationDigest: { type: "string" }
        }
      }
    },
    ecosystemHardeningScore: { type: "number", minimum: 0, maximum: 1 },
    auditedAt: { type: "string" },
    securityAuditorSignatureHex: { type: "string" }
  }
} as const;

export const sandboxEconomicAuditReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-economic-audit-report.json",
  title: "SandboxEconomicAuditReport",
  type: "object",
  required: [
    "auditId",
    "phase",
    "auditedVersion",
    "verdict",
    "dimensionsAudited",
    "sustainableDimensionsCount",
    "lockInRiskScore",
    "localExecutionViabilityScore",
    "commercialExtensibilityScore",
    "dimensionResults",
    "auditedAt",
    "releaseAuthoritySignatureHex"
  ],
  properties: {
    auditId: { type: "string" },
    phase: {
      type: "string",
      enum: ["SANDBOX_PHASE"]
    },
    auditedVersion: { type: "string" },
    verdict: {
      type: "string",
      enum: ["APPROVED_RELEASE_CANDIDATE", "CONDITIONALLY_APPROVED", "REJECTED_VENDOR_LOCKIN"]
    },
    dimensionsAudited: { type: "integer", minimum: 1 },
    sustainableDimensionsCount: { type: "integer", minimum: 0 },
    lockInRiskScore: { type: "number", minimum: 0, maximum: 1 },
    localExecutionViabilityScore: { type: "number", minimum: 0, maximum: 1 },
    commercialExtensibilityScore: { type: "number", minimum: 0, maximum: 1 },
    dimensionResults: {
      type: "array",
      items: {
        type: "object",
        required: [
          "dimensionId",
          "dimensionName",
          "auditCriterion",
          "sustainablePosture",
          "vendorLockInRisk",
          "operationalCostModel",
          "findings",
          "evidenceArtifact"
        ],
        properties: {
          dimensionId: { type: "string" },
          dimensionName: { type: "string" },
          auditCriterion: { type: "string" },
          sustainablePosture: { type: "boolean" },
          vendorLockInRisk: {
            type: "string",
            enum: ["ZERO", "LOW", "MEDIUM", "CRITICAL"]
          },
          operationalCostModel: { type: "string" },
          findings: { type: "string" },
          evidenceArtifact: { type: "string" }
        }
      }
    },
    auditedAt: { type: "string" },
    releaseAuthoritySignatureHex: { type: "string" }
  }
} as const;

export const sandboxArchitectureAuditReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-architecture-audit-report.json",
  title: "SandboxArchitectureAuditReport",
  type: "object",
  required: [
    "auditId",
    "phase",
    "auditedVersion",
    "verdict",
    "checksTotal",
    "checksPassed",
    "architectureHealthScore",
    "couplingLeakageDetected",
    "checks",
    "auditedAt",
    "auditorSignatureHex"
  ],
  properties: {
    auditId: { type: "string" },
    phase: {
      type: "string",
      enum: ["SANDBOX_PHASE"]
    },
    auditedVersion: { type: "string" },
    verdict: {
      type: "string",
      enum: ["APPROVED_RELEASE_CANDIDATE", "CONDITIONALLY_APPROVED", "REJECTED_ARCHITECTURE_FLAWS"]
    },
    checksTotal: { type: "integer", minimum: 1 },
    checksPassed: { type: "integer", minimum: 0 },
    architectureHealthScore: { type: "number", minimum: 0, maximum: 1 },
    couplingLeakageDetected: { type: "boolean" },
    checks: {
      type: "array",
      items: {
        type: "object",
        required: [
          "checkId",
          "requirement",
          "designed",
          "implemented",
          "tested",
          "verified",
          "status",
          "evidenceFile"
        ],
        properties: {
          checkId: { type: "integer", minimum: 1 },
          requirement: { type: "string" },
          designed: { type: "boolean" },
          implemented: { type: "boolean" },
          tested: { type: "boolean" },
          verified: { type: "boolean" },
          status: {
            type: "string",
            enum: ["PASS", "FAIL", "INCOMPLETE", "NOT_VERIFIED", "OUT_OF_SCOPE"]
          },
          evidenceFile: { type: "string" }
        }
      }
    },
    auditedAt: { type: "string" },
    auditorSignatureHex: { type: "string" }
  }
} as const;

export const spisProviderInteroperabilityManifestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/provider-interoperability-manifest.json",
  title: "SpisProviderInteroperabilityManifest",
  type: "object",
  required: [
    "spisVersion",
    "providerId",
    "conformanceLevel",
    "supportedRuntimes",
    "supportedSecurityProfiles",
    "supportedExtensions",
    "evidenceHashAlgorithm",
    "lifecycleEndpoint",
    "manifestDigest",
    "certificationSignatureHex"
  ],
  properties: {
    spisVersion: { type: "string" },
    providerId: { type: "string" },
    conformanceLevel: {
      type: "string",
      enum: ["SPIS_CORE_L1", "SPIS_HERMETIC_L2", "SPIS_FULL_OBSERVABLE_L3"]
    },
    supportedRuntimes: {
      type: "array",
      items: { type: "string" }
    },
    supportedSecurityProfiles: {
      type: "array",
      items: { type: "string" }
    },
    supportedExtensions: {
      type: "array",
      items: { type: "string" }
    },
    evidenceHashAlgorithm: {
      type: "string",
      enum: ["sha256", "sha512"]
    },
    lifecycleEndpoint: { type: "string" },
    manifestDigest: { type: "string" },
    certificationSignatureHex: { type: "string" }
  }
} as const;

export const sandboxPhaseCompletionReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-phase-completion-report.json",
  title: "SandboxPhaseCompletionReport",
  type: "object",
  required: [
    "phase",
    "version",
    "promptsCompleted",
    "totalSpecsCreated",
    "totalAdrsCreated",
    "totalTestSuitesPassing",
    "totalUnitTestsPassing",
    "checksVerifiedCount",
    "zeroDaysFound",
    "lockInRisk",
    "verdict",
    "auditedAt",
    "releaseSealSignatureHex"
  ],
  properties: {
    phase: {
      type: "string",
      enum: ["SANDBOX_PHASE"]
    },
    version: { type: "string" },
    promptsCompleted: { type: "integer", minimum: 1 },
    totalSpecsCreated: { type: "integer", minimum: 1 },
    totalAdrsCreated: { type: "integer", minimum: 1 },
    totalTestSuitesPassing: { type: "integer", minimum: 1 },
    totalUnitTestsPassing: { type: "integer", minimum: 1 },
    checksVerifiedCount: { type: "integer", minimum: 1 },
    zeroDaysFound: { type: "integer", minimum: 0 },
    lockInRisk: { type: "number", minimum: 0, maximum: 1 },
    verdict: {
      type: "string",
      enum: ["PHASE_COMPLETED_AND_SEALED", "CONDITIONALLY_COMPLETED", "PHASE_INCOMPLETE"]
    },
    auditedAt: { type: "string" },
    releaseSealSignatureHex: { type: "string" }
  }
} as const;

export const sandboxReleaseGateDecisionSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://semantiq.dev/schemas/sandbox/sandbox-release-gate-decision.json",
  title: "SandboxReleaseGateDecision",
  type: "object",
  required: [
    "gateId",
    "phase",
    "releaseTag",
    "verdict",
    "totalChecksEvaluated",
    "totalChecksPassed",
    "blockingFindingsCount",
    "nonBlockingLimitationsCount",
    "testSuitesPassed",
    "testsPassed",
    "securityPosture",
    "economicBurdenScore",
    "gateEvaluatedAt",
    "releaseAuthoritySignatureHex"
  ],
  properties: {
    gateId: { type: "string" },
    phase: {
      type: "string",
      enum: ["SANDBOX_PHASE"]
    },
    releaseTag: { type: "string" },
    verdict: {
      type: "string",
      enum: ["PASS", "CONDITIONAL_PASS", "FAIL"]
    },
    totalChecksEvaluated: { type: "integer", minimum: 1 },
    totalChecksPassed: { type: "integer", minimum: 0 },
    blockingFindingsCount: { type: "integer", minimum: 0 },
    nonBlockingLimitationsCount: { type: "integer", minimum: 0 },
    testSuitesPassed: { type: "integer", minimum: 1 },
    testsPassed: { type: "integer", minimum: 1 },
    securityPosture: {
      type: "string",
      enum: ["HARDENED_ZERO_DAY_CLEAN"]
    },
    economicBurdenScore: { type: "number", minimum: 0 },
    gateEvaluatedAt: { type: "string" },
    releaseAuthoritySignatureHex: { type: "string" }
  }
} as const;
