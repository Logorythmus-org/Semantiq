import { createApiApplication } from "./server.js";
import { loadTechClubSettings } from "../../../packages/config/src/index.js";
import {
  createQuestionApplication,
  createQuestionDiscoveryApplication,
  createQuestionRelationApplication,
  ConfiguredQuestionSafetyCapabilityPolicy,
  createQuestionSafetyApplication,
  LocalFixedWindowQuestionRateLimiter,
  createQuestionSemanticApplication
} from "../../../packages/questions/src/index.js";
import {
  checkDatabaseHealth,
  createPostgresPool,
  migrate,
  PostgresQuestionReadRepository,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionSafetyUnitOfWork,
  PostgresQuestionUnitOfWork
} from "../../../packages/persistence/src/index.js";

const settings = loadTechClubSettings();
const pool = createPostgresPool({
  connectionString: settings.database.databaseUrl,
  max: settings.database.poolSize,
  connectionTimeoutMillis: settings.database.connectTimeoutMs,
  statement_timeout: settings.database.statementTimeoutMs
});
const questionApplication = createQuestionApplication({
  createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
});
const questionDiscoveryApplication = createQuestionDiscoveryApplication({
  repository: new PostgresQuestionReadRepository(pool)
});
const questionRelationApplication = createQuestionRelationApplication({
  createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
});
const questionSemanticApplication = createQuestionSemanticApplication({
  createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
});
const moderatorActors = (process.env.QUESTION_MODERATOR_ACTORS ?? "moderator-local")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const questionSafetyApplication = createQuestionSafetyApplication({
  createUnitOfWork: () => new PostgresQuestionSafetyUnitOfWork(pool),
  capabilities: new ConfiguredQuestionSafetyCapabilityPolicy(moderatorActors)
});
const questionRateLimiter = new LocalFixedWindowQuestionRateLimiter(
  {
    create: 30,
    update: 60,
    relation: 60,
    semantic: 30,
    source: 30,
    report: 10,
    search: 120,
    graph: 60,
    moderation: 60
  },
  undefined,
  60_000,
  10_000,
  process.env.QUESTION_RATE_LIMIT_DISABLED === "1"
);
const application = createApiApplication({
  settings,
  questionApplication,
  questionDiscoveryApplication,
  questionRelationApplication,
  questionSemanticApplication,
  questionSafetyApplication,
  questionRateLimiter,
  databaseHealth: async () => {
    const health = await checkDatabaseHealth(pool);
    return { status: health.status, message: health.message ?? "Database health checked" };
  }
});

const shutdown = () => {
  void application.stop().finally(() => {
    void pool.end().finally(() => process.exit(0));
  });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
void migrate(pool)
  .then(() => application.start())
  .then(() => console.log("Tech Club local API started with PostgreSQL Question Runtime"))
  .catch((error: unknown) => {
    console.error("API startup failed", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  });
