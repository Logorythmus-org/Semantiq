import { performance } from "node:perf_hooks";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionReadRepository
} from "../packages/persistence/src/index.js";
import {
  createQuestionDiscoveryApplication,
  type SearchQuestionsQuery
} from "../packages/questions/src/index.js";

if (process.env.QUESTION_DISCOVERY_BENCHMARK_ALLOW_RESET !== "1")
  throw new Error(
    "Set QUESTION_DISCOVERY_BENCHMARK_ALLOW_RESET=1 for an isolated benchmark database"
  );

const connectionString =
  process.env.QUESTION_DISCOVERY_BENCHMARK_DATABASE_URL ??
  "postgresql://techclub:techclub@127.0.0.1:5432/techclub";
const pool = createPostgresPool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});
await migrate(pool);
const repository = new PostgresQuestionReadRepository(pool);
const application = createQuestionDiscoveryApplication({ repository });
const output: Array<{
  datasetSize: number;
  iterations: number;
  measurements: Readonly<Record<string, Measurement>>;
}> = [];

for (const datasetSize of [100, 1_000, 10_000]) {
  await seed(datasetSize);
  const iterations = datasetSize === 10_000 ? 20 : 10;
  const middleTimestamp = new Date(
    Date.parse("2026-01-01T00:00:00.000Z") + Math.floor(datasetSize / 2) * 1000
  ).toISOString();
  const marker = `marker-${String(datasetSize - 1).padStart(6, "0")}`;
  const cases: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
    ["exact_by_id", () => repository.getQuestionSummary(questionId(Math.floor(datasetSize / 2)))],
    ["listing_first_page", () => discover({})],
    ["listing_middle_page", () => discover({ createdBefore: middleTimestamp })],
    ["filter_archived", () => discover({ status: "archived" })],
    ["filter_creator", () => discover({ creatorId: "benchmark-owner-042" })],
    ["filter_has_frame", () => discover({ hasFrame: true })],
    ["filter_frame_stale", () => discover({ frameStale: true })],
    ["filter_uncertainty", () => discover({ uncertaintyType: "high" })],
    ["filter_relation_type", () => discover({ relationType: "refines" })],
    ["search_common", () => discover({ textQuery: "benchmark" })],
    ["search_rare", () => discover({ textQuery: marker })],
    ["search_no_result", () => discover({ textQuery: "term-that-does-not-exist" })],
    ["search_persian", () => discover({ textQuery: "معماری" })],
    ["search_german", () => discover({ textQuery: "ARCHITEKTUR" })],
    ["combined_text_frame", () => discover({ textQuery: "benchmark", hasFrame: true })],
    ["combined_text_relation", () => discover({ textQuery: "benchmark", relationType: "refines" })],
    [
      "combined_structured",
      () =>
        discover({
          language: "en",
          hasFrame: true,
          hasAssumptions: true,
          uncertaintyType: "high"
        })
    ]
  ];
  const measurements: Record<string, Measurement> = {};
  for (const [name, work] of cases) measurements[name] = await measure(work, iterations);
  output.push({ datasetSize, iterations, measurements });
}

const database = await pool.query<{ version: string }>(
  "SELECT current_setting('server_version') AS version"
);
console.log(
  JSON.stringify(
    {
      databaseVersion: database.rows[0]?.version,
      generatedAt: new Date().toISOString(),
      tiers: output
    },
    null,
    2
  )
);
await pool.end();

interface Measurement {
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly errors: number;
}

async function discover(query: Omit<SearchQuestionsQuery, "correlationId">): Promise<unknown> {
  const result = await application.search({
    ...query,
    correlationId: "question-discovery-benchmark"
  });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

async function measure(work: () => Promise<unknown>, iterations: number): Promise<Measurement> {
  await work();
  await work();
  const durations: number[] = [];
  let errors = 0;
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    try {
      await work();
    } catch {
      errors += 1;
    }
    durations.push(performance.now() - started);
  }
  durations.sort((left, right) => left - right);
  return {
    medianMs: rounded(percentile(durations, 0.5)),
    p95Ms: rounded(percentile(durations, 0.95)),
    minMs: rounded(durations[0] ?? 0),
    maxMs: rounded(durations.at(-1) ?? 0),
    errors
  };
}

function percentile(values: readonly number[], value: number): number {
  return values[Math.max(0, Math.ceil(values.length * value) - 1)] ?? 0;
}

function rounded(value: number): number {
  return Number(value.toFixed(3));
}

async function seed(size: number): Promise<void> {
  await pool.query(
    "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
  );
  await pool.query(
    `INSERT INTO questions (
      id,text,status,language,source,creator_id,created_at,updated_at,version
    )
    SELECT
      'benchmark-q-' || lpad(series::text,6,'0'),
      CASE series % 3
        WHEN 0 THEN 'How does benchmark architecture common Question ' || series || ' remain discoverable marker-' || lpad(series::text,6,'0') || '?'
        WHEN 1 THEN 'Wie bleibt benchmark Architektur Frage Unsicherheit ' || series || ' auffindbar marker-' || lpad(series::text,6,'0') || '?'
        ELSE 'چگونه پرسش benchmark معماری عدم قطعیت ' || series || ' پیدا می‌شود marker-' || lpad(series::text,6,'0') || '؟'
      END,
      CASE WHEN series % 10 = 0 THEN 'archived' ELSE 'published' END,
      CASE series % 3 WHEN 0 THEN 'en' WHEN 1 THEN 'de' ELSE 'fa' END,
      'human',
      'benchmark-owner-' || lpad((series % 100)::text,3,'0'),
      timestamptz '2026-01-01T00:00:00Z' + series * interval '1 second',
      timestamptz '2026-01-01T00:00:00Z' + series * interval '1 second',
      CASE WHEN series % 4 = 0 THEN 4 ELSE 1 END
    FROM generate_series(0,$1 - 1) AS series`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_revisions (
      id,question_id,version,previous_text,text,previous_status,status,
      change_type,changed_by,changed_at,reason,correlation_id
    )
    SELECT
      'benchmark-revision-' || lpad(series::text,6,'0') || '-' || revision,
      'benchmark-q-' || lpad(series::text,6,'0'),
      revision,
      'Historical benchmark Question ' || series || ' revision ' || (revision - 1) || '?',
      'Historical benchmark Question ' || series || ' revision ' || revision || '?',
      'published','published','updated',
      'benchmark-owner-' || lpad((series % 100)::text,3,'0'),
      timestamptz '2026-01-01T01:00:00Z' + (series * 3 + revision) * interval '1 second',
      'Deterministic performance fixture',
      'benchmark-revision-' || series || '-' || revision
    FROM generate_series(0,$1 - 1,4) AS series
    CROSS JOIN generate_series(2,4) AS revision`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_semantic_structures (
      question_id,structure,question_version_at_last_update,
      created_by,updated_by,created_at,updated_at,version
    )
    SELECT
      id,
      jsonb_build_object(
        'context',jsonb_build_array('A deterministic local benchmark.'),
        'assumptions',CASE WHEN generated.series % 4 = 0 THEN jsonb_build_array('The benchmark input is explicit.') ELSE '[]'::jsonb END,
        'constraints',jsonb_build_array('No external search service is used.'),
        'unknowns',CASE WHEN generated.series % 6 = 0 THEN jsonb_build_array('Which query is most frequent?') ELSE '[]'::jsonb END,
        'uncertainty',jsonb_build_object(
          'level',CASE WHEN generated.series % 4 = 0 THEN 'high' ELSE 'low' END,
          'statements',jsonb_build_array('Benchmark uncertainty is declared.')
        ),
        'scope',jsonb_build_object(
          'inclusions',jsonb_build_array('Question discovery'),
          'exclusions',jsonb_build_array('Recommendation ranking')
        ),
        'perspectives',jsonb_build_array('Benchmark client'),
        'openPossibilities',jsonb_build_array('Future provider adapter')
      ),
      CASE WHEN generated.series % 4 = 0 THEN 1 ELSE version END,
      creator_id,creator_id,created_at,updated_at,1
    FROM (
      SELECT questions.*,substring(questions.id from '[0-9]+$')::integer AS series
      FROM questions
    ) AS generated
    WHERE generated.series % 2 = 0`
  );
  await pool.query(
    `INSERT INTO question_relations (
      id,source_question_id,target_question_id,type,created_by,created_at,version
    )
    SELECT
      'benchmark-r-' || lpad(series::text,6,'0') || '-' || relation_offset,
      'benchmark-q-' || lpad(series::text,6,'0'),
      'benchmark-q-' || lpad((series + relation_offset)::text,6,'0'),
      CASE relation_offset WHEN 1 THEN 'refines' WHEN 2 THEN 'depends_on' ELSE 'connects' END,
      'benchmark-owner-' || lpad((series % 100)::text,3,'0'),
      timestamptz '2026-01-02T00:00:00Z' + series * interval '1 second',
      1
    FROM generate_series(0,$1 - 4) AS series
    CROSS JOIN generate_series(1,3) AS relation_offset`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_source_references (
      id,question_id,source_type,title,locator,normalized_locator,declared_by,declared_at,
      status,verification_state,version
    )
    SELECT 'benchmark-source-' || series,'benchmark-q-' || lpad(series::text,6,'0'),
      'dataset','Benchmark dataset source','dataset:benchmark:' || series,
      'dataset:benchmark:' || series,'benchmark-owner-' || lpad((series % 100)::text,3,'0'),
      timestamptz '2026-01-03T00:00:00Z' + series * interval '1 second',
      'active','declared',1
    FROM generate_series(0,$1 - 1,20) AS series`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_reports (
      id,question_id,reporter_id,reason_code,description,status,created_at,updated_at,
      correlation_id,version
    )
    SELECT 'benchmark-report-' || series,'benchmark-q-' || lpad(series::text,6,'0'),
      'benchmark-reporter','off_topic','Deterministic low-volume performance fixture report.',
      'under_review',timestamptz '2026-01-04T00:00:00Z' + series * interval '1 second',
      timestamptz '2026-01-04T00:00:00Z' + series * interval '1 second',
      'benchmark-report-' || series,2
    FROM generate_series(0,$1 - 1,100) AS series`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_moderation_cases (
      id,question_id,report_ids,status,opened_at,opened_by,version
    )
    SELECT 'benchmark-case-' || series,'benchmark-q-' || lpad(series::text,6,'0'),
      jsonb_build_array('benchmark-report-' || series),'under_review',
      timestamptz '2026-01-05T00:00:00Z' + series * interval '1 second',
      'benchmark-moderator',2
    FROM generate_series(0,$1 - 1,1000) AS series`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_moderation_states (
      question_id,state,version,updated_at,updated_by,last_reviewed_at
    )
    SELECT 'benchmark-q-' || lpad(series::text,6,'0'),'under_review',1,
      timestamptz '2026-01-05T00:00:00Z' + series * interval '1 second',
      'benchmark-moderator',timestamptz '2026-01-05T00:00:00Z' + series * interval '1 second'
    FROM generate_series(0,$1 - 1,1000) AS series`,
    [size]
  );
  await pool.query(
    `INSERT INTO question_audit_records (
      id,question_id,actor_id,action,target_type,target_id,occurred_at,correlation_id,result,metadata
    )
    SELECT 'benchmark-audit-' || series || '-' || audit_number,
      'benchmark-q-' || lpad(series::text,6,'0'),'benchmark-observer','benchmark.observed',
      'Question','benchmark-q-' || lpad(series::text,6,'0'),
      timestamptz '2026-01-06T00:00:00Z' + (series + audit_number) * interval '1 second',
      'benchmark-audit-' || series || '-' || audit_number,'success','{}'::jsonb
    FROM generate_series(0,$1 - 1,50) AS series
    CROSS JOIN generate_series(1,2) AS audit_number`,
    [size]
  );
  await pool.query("ANALYZE questions");
  await pool.query("ANALYZE question_revisions");
  await pool.query("ANALYZE question_semantic_structures");
  await pool.query("ANALYZE question_relations");
  await pool.query("ANALYZE question_source_references");
  await pool.query("ANALYZE question_reports");
  await pool.query("ANALYZE question_audit_records");
}

function questionId(value: number): string {
  return `benchmark-q-${String(value).padStart(6, "0")}`;
}
