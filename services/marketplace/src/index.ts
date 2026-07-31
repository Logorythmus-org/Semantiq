export const marketplaceService = {
  name: "marketplace",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint4-runtime"] },
  routes: [
    "POST /assets",
    "POST /assets/{assetId}/package",
    "POST /assets/{assetId}/validate",
    "POST /assets/{assetId}/publish",
    "GET /marketplace/search",
    "GET /marketplace/listings/{listingId}",
    "POST /installations/plans",
    "POST /installations/{planId}/approve",
    "POST /reviews",
    "POST /moderation/reports"
  ]
} as const;
