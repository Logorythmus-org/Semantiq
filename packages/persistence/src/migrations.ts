import type { SqlClient } from "./client.js";

export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}
export const initialMigration: Migration = {
  version: 1,
  name: "foundation",
  sql: `
CREATE TABLE IF NOT EXISTS system_metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS idempotency_records (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (scope, key_hash)
);
CREATE TABLE IF NOT EXISTS outbox_events (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT,
  aggregate_id TEXT,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL,
  correlation_id TEXT,
  causation_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS outbox_events_pending_idx ON outbox_events (processed_at, created_at);
`
};

export const questionMigration: Migration = {
  version: 2,
  name: "questions",
  sql: `
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 10 AND 2000),
  status TEXT NOT NULL CHECK (status = 'published'),
  language TEXT NOT NULL CHECK (language ~ '^[a-z]{2,8}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  source TEXT NOT NULL CHECK (source IN ('human', 'import', 'agent', 'system')),
  creator_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);
CREATE INDEX IF NOT EXISTS questions_created_at_idx ON questions (created_at DESC);
`
};

export const questionLifecycleMigration: Migration = {
  version: 3,
  name: "question_lifecycle_revisions",
  sql: `
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_status_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_status_check CHECK (status IN ('published', 'archived'));

CREATE TABLE IF NOT EXISTS question_revisions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 2),
  previous_text TEXT NOT NULL CHECK (char_length(previous_text) BETWEEN 10 AND 2000),
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 10 AND 2000),
  previous_status TEXT NOT NULL CHECK (previous_status IN ('published', 'archived')),
  status TEXT NOT NULL CHECK (status IN ('published', 'archived')),
  change_type TEXT NOT NULL CHECK (change_type IN ('updated', 'archived', 'restored')),
  changed_by TEXT NOT NULL CHECK (char_length(changed_by) BETWEEN 1 AND 128),
  changed_at TIMESTAMPTZ NOT NULL,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 500),
  correlation_id TEXT NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  UNIQUE (question_id, version)
);

CREATE OR REPLACE FUNCTION prevent_question_revision_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'question revisions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_revisions_immutable ON question_revisions;
CREATE TRIGGER question_revisions_immutable
BEFORE UPDATE OR DELETE ON question_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_question_revision_mutation();
`
};

export const questionRelationsMigration: Migration = {
  version: 4,
  name: "question_relations",
  sql: `
CREATE TABLE IF NOT EXISTS question_relations (
  id TEXT PRIMARY KEY,
  source_question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  target_question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN (
    'emerges_from',
    'refines',
    'challenges',
    'contradicts',
    'depends_on',
    'broadens',
    'narrows',
    'alternative_to',
    'connects'
  )),
  created_by TEXT NOT NULL CHECK (char_length(created_by) BETWEEN 1 AND 128),
  created_at TIMESTAMPTZ NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version = 1),
  canonical_type TEXT GENERATED ALWAYS AS (
    CASE WHEN type = 'narrows' THEN 'broadens' ELSE type END
  ) STORED,
  canonical_source_question_id TEXT GENERATED ALWAYS AS (
    CASE
      WHEN type = 'narrows' THEN target_question_id
      WHEN type IN ('contradicts', 'alternative_to', 'connects')
        THEN LEAST(source_question_id, target_question_id)
      ELSE source_question_id
    END
  ) STORED,
  canonical_target_question_id TEXT GENERATED ALWAYS AS (
    CASE
      WHEN type = 'narrows' THEN source_question_id
      WHEN type IN ('contradicts', 'alternative_to', 'connects')
        THEN GREATEST(source_question_id, target_question_id)
      ELSE target_question_id
    END
  ) STORED,
  CONSTRAINT question_relations_distinct_endpoints CHECK (source_question_id <> target_question_id),
  CONSTRAINT question_relations_semantic_identity_unique UNIQUE (
    canonical_type,
    canonical_source_question_id,
    canonical_target_question_id
  )
);

CREATE INDEX IF NOT EXISTS question_relations_source_idx
  ON question_relations (source_question_id, created_at, id);
CREATE INDEX IF NOT EXISTS question_relations_target_idx
  ON question_relations (target_question_id, created_at, id);
CREATE INDEX IF NOT EXISTS question_relations_type_idx
  ON question_relations (type, created_at, id);

CREATE OR REPLACE FUNCTION prevent_question_relation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'question relations are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_relations_immutable ON question_relations;
CREATE TRIGGER question_relations_immutable
BEFORE UPDATE OR DELETE ON question_relations
FOR EACH ROW EXECUTE FUNCTION prevent_question_relation_mutation();
`
};

export const questionSemanticStructuresMigration: Migration = {
  version: 5,
  name: "question_semantic_structures",
  sql: `
CREATE OR REPLACE FUNCTION is_valid_question_semantic_list(value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item JSONB;
  item_text TEXT;
  seen TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF value IS NULL OR jsonb_typeof(value) <> 'array' OR jsonb_array_length(value) > 32 THEN
    RETURN FALSE;
  END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(value)
  LOOP
    IF jsonb_typeof(item) <> 'string' THEN
      RETURN FALSE;
    END IF;
    item_text := item #>> '{}';
    IF char_length(btrim(item_text)) NOT BETWEEN 1 AND 500 OR item_text = ANY(seen) THEN
      RETURN FALSE;
    END IF;
    seen := array_append(seen, item_text);
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION is_valid_question_semantic_structure(value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  uncertainty JSONB;
  scope JSONB;
  total_items INTEGER;
BEGIN
  IF value IS NULL OR jsonb_typeof(value) <> 'object' THEN
    RETURN FALSE;
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(value)) <> 8 OR NOT value ?& ARRAY[
    'context',
    'assumptions',
    'constraints',
    'unknowns',
    'uncertainty',
    'scope',
    'perspectives',
    'openPossibilities'
  ] THEN
    RETURN FALSE;
  END IF;
  IF NOT is_valid_question_semantic_list(value->'context')
    OR NOT is_valid_question_semantic_list(value->'assumptions')
    OR NOT is_valid_question_semantic_list(value->'constraints')
    OR NOT is_valid_question_semantic_list(value->'unknowns')
    OR NOT is_valid_question_semantic_list(value->'perspectives')
    OR NOT is_valid_question_semantic_list(value->'openPossibilities') THEN
    RETURN FALSE;
  END IF;

  uncertainty := value->'uncertainty';
  IF uncertainty IS NULL OR jsonb_typeof(uncertainty) <> 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(uncertainty)) <> 2
    OR NOT uncertainty ?& ARRAY['level', 'statements']
    OR uncertainty->>'level' NOT IN ('unspecified', 'low', 'medium', 'high')
    OR NOT is_valid_question_semantic_list(uncertainty->'statements') THEN
    RETURN FALSE;
  END IF;
  IF uncertainty->>'level' <> 'unspecified'
    AND jsonb_array_length(uncertainty->'statements') = 0 THEN
    RETURN FALSE;
  END IF;

  scope := value->'scope';
  IF scope IS NULL OR jsonb_typeof(scope) <> 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(scope)) <> 2
    OR NOT scope ?& ARRAY['inclusions', 'exclusions']
    OR NOT is_valid_question_semantic_list(scope->'inclusions')
    OR NOT is_valid_question_semantic_list(scope->'exclusions') THEN
    RETURN FALSE;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(scope->'inclusions') AS included(item)
    JOIN jsonb_array_elements_text(scope->'exclusions') AS excluded(item)
      ON included.item = excluded.item
  ) THEN
    RETURN FALSE;
  END IF;

  total_items :=
    jsonb_array_length(value->'context') +
    jsonb_array_length(value->'assumptions') +
    jsonb_array_length(value->'constraints') +
    jsonb_array_length(value->'unknowns') +
    jsonb_array_length(uncertainty->'statements') +
    jsonb_array_length(scope->'inclusions') +
    jsonb_array_length(scope->'exclusions') +
    jsonb_array_length(value->'perspectives') +
    jsonb_array_length(value->'openPossibilities');
  RETURN total_items <= 128;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS question_semantic_structures (
  question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE RESTRICT,
  structure JSONB NOT NULL CHECK (is_valid_question_semantic_structure(structure)),
  created_by TEXT NOT NULL CHECK (char_length(created_by) BETWEEN 1 AND 128),
  updated_by TEXT NOT NULL CHECK (char_length(updated_by) BETWEEN 1 AND 128),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS question_semantic_revisions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question_semantic_structures(question_id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 2),
  previous_structure JSONB NOT NULL CHECK (
    is_valid_question_semantic_structure(previous_structure)
  ),
  structure JSONB NOT NULL CHECK (is_valid_question_semantic_structure(structure)),
  changed_by TEXT NOT NULL CHECK (char_length(changed_by) BETWEEN 1 AND 128),
  changed_at TIMESTAMPTZ NOT NULL,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 500),
  correlation_id TEXT NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  UNIQUE (question_id, version)
);

CREATE OR REPLACE FUNCTION prevent_question_semantic_structure_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'question semantic structures cannot be deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_semantic_structures_no_delete ON question_semantic_structures;
CREATE TRIGGER question_semantic_structures_no_delete
BEFORE DELETE ON question_semantic_structures
FOR EACH ROW EXECUTE FUNCTION prevent_question_semantic_structure_deletion();

CREATE OR REPLACE FUNCTION prevent_question_semantic_revision_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'question semantic revisions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_semantic_revisions_immutable ON question_semantic_revisions;
CREATE TRIGGER question_semantic_revisions_immutable
BEFORE UPDATE OR DELETE ON question_semantic_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_question_semantic_revision_mutation();
`
};

export const questionDiscoveryMigration: Migration = {
  version: 6,
  name: "question_discovery",
  sql: `
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE OR REPLACE FUNCTION normalize_question_search_text(value TEXT)
RETURNS TEXT AS $$
  SELECT btrim(
    regexp_replace(
      lower(
        translate(
          replace(normalize(value, NFKC), 'ـ', ''),
          'يىك' || chr(8204) || chr(160),
          'ییک  '
        )
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS search_text TEXT
  GENERATED ALWAYS AS (normalize_question_search_text(text)) STORED;

ALTER TABLE question_semantic_structures
  ADD COLUMN IF NOT EXISTS question_version_at_last_update INTEGER NOT NULL DEFAULT 1;

UPDATE question_semantic_structures AS semantic
SET question_version_at_last_update = question.version
FROM questions AS question
WHERE question.id = semantic.question_id;

ALTER TABLE question_semantic_structures
  DROP CONSTRAINT IF EXISTS question_semantic_question_version_check;
ALTER TABLE question_semantic_structures
  ADD CONSTRAINT question_semantic_question_version_check
  CHECK (question_version_at_last_update >= 1);

CREATE INDEX IF NOT EXISTS questions_discovery_newest_idx
  ON questions (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS questions_discovery_updated_idx
  ON questions (status, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS questions_discovery_creator_idx
  ON questions (creator_id, status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS questions_search_trigram_idx
  ON questions USING GIN (search_text public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS question_semantic_uncertainty_level_idx
  ON question_semantic_structures ((structure->'uncertainty'->>'level'));
CREATE INDEX IF NOT EXISTS question_relations_source_type_target_idx
  ON question_relations (source_question_id, type, target_question_id);
CREATE INDEX IF NOT EXISTS question_relations_target_type_source_idx
  ON question_relations (target_question_id, type, source_question_id);
`
};

export const questionTrustSafetyMigration: Migration = {
  version: 7,
  name: "question_trust_safety",
  sql: `
CREATE TABLE IF NOT EXISTS question_source_references (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL CHECK (source_type IN ('web','book','paper','dataset','document','conversation','observation','experiment','personal_experience','repository','other')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  locator TEXT NOT NULL CHECK (char_length(locator) BETWEEN 1 AND 1000),
  normalized_locator TEXT NOT NULL CHECK (char_length(normalized_locator) BETWEEN 1 AND 1000),
  description TEXT CHECK (description IS NULL OR char_length(description) BETWEEN 1 AND 1000),
  declared_by TEXT NOT NULL CHECK (char_length(declared_by) BETWEEN 1 AND 128),
  declared_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','removed')),
  verification_state TEXT NOT NULL CHECK (verification_state IN ('declared','format_validated','externally_verified','unavailable','disputed','removed')),
  declared_classification TEXT NOT NULL DEFAULT 'USER_DECLARED' CHECK (declared_classification='USER_DECLARED'),
  verification_classification TEXT NOT NULL DEFAULT 'SYSTEM_OBSERVED' CHECK (verification_classification='SYSTEM_OBSERVED'),
  version INTEGER NOT NULL CHECK (version >= 1),
  removed_by TEXT, removed_at TIMESTAMPTZ, removal_reason TEXT,
  CHECK ((status='active' AND removed_at IS NULL AND removed_by IS NULL) OR (status='removed' AND removed_at IS NOT NULL AND removed_by IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS question_source_active_unique
  ON question_source_references (question_id,source_type,normalized_locator) WHERE status='active';
CREATE INDEX IF NOT EXISTS question_source_list_idx ON question_source_references (question_id,status,declared_at,id);

CREATE TABLE IF NOT EXISTS question_reports (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  reporter_id TEXT NOT NULL CHECK (char_length(reporter_id) BETWEEN 1 AND 128),
  reason_code TEXT NOT NULL CHECK (reason_code IN ('spam','harassment','personal_data','illegal_content','dangerous_content','copyright','misleading_context','duplicate','off_topic','other')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  status TEXT NOT NULL CHECK (status IN ('open','under_review','resolved','dismissed','withdrawn')),
  created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
  correlation_id TEXT NOT NULL CHECK (char_length(correlation_id) BETWEEN 1 AND 128),
  version INTEGER NOT NULL CHECK (version >= 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS question_report_active_unique
  ON question_reports (question_id,reporter_id,reason_code) WHERE status IN ('open','under_review');
CREATE INDEX IF NOT EXISTS question_report_review_idx ON question_reports (question_id,status,created_at,id);

CREATE TABLE IF NOT EXISTS question_moderation_states (
  question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE RESTRICT,
  state TEXT NOT NULL CHECK (state IN ('clear','under_review','discovery_restricted')),
  version INTEGER NOT NULL CHECK (version >= 1), updated_at TIMESTAMPTZ NOT NULL,
  updated_by TEXT, last_reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS question_moderation_discovery_idx ON question_moderation_states (state,question_id);

CREATE TABLE IF NOT EXISTS question_moderation_cases (
  id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  report_ids JSONB NOT NULL CHECK (jsonb_typeof(report_ids)='array' AND jsonb_array_length(report_ids) BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK (status IN ('open','under_review','action_required','resolved','dismissed')),
  opened_at TIMESTAMPTZ NOT NULL, opened_by TEXT NOT NULL, assigned_to TEXT,
  resolution TEXT, resolved_at TIMESTAMPTZ, version INTEGER NOT NULL CHECK (version >= 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS question_moderation_active_case_unique
  ON question_moderation_cases (question_id) WHERE status IN ('open','under_review','action_required');

CREATE TABLE IF NOT EXISTS question_moderation_actions (
  id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES question_moderation_cases(id) ON DELETE RESTRICT,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL CHECK (action_type IN ('no_action','mark_under_review','restrict_discovery','archive_question','restore_question','request_revision','dismiss_reports')),
  actor_id TEXT NOT NULL, reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  applied_at TIMESTAMPTZ NOT NULL, case_version INTEGER NOT NULL CHECK (case_version >= 2)
);

CREATE TABLE IF NOT EXISTS question_audit_records (
  id TEXT PRIMARY KEY, question_id TEXT REFERENCES questions(id) ON DELETE RESTRICT,
  actor_id TEXT NOT NULL CHECK (char_length(actor_id) BETWEEN 1 AND 128),
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 128),
  target_type TEXT NOT NULL CHECK (char_length(target_type) BETWEEN 1 AND 128),
  target_id TEXT NOT NULL CHECK (char_length(target_id) BETWEEN 1 AND 128),
  occurred_at TIMESTAMPTZ NOT NULL, correlation_id TEXT NOT NULL,
  causation_id TEXT, result TEXT NOT NULL CHECK (result IN ('success','failure')),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 500),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object' AND pg_column_size(metadata) <= 4096),
  event_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS question_audit_query_idx ON question_audit_records (question_id,occurred_at DESC,id DESC);

CREATE OR REPLACE FUNCTION prevent_question_append_only_mutation()
RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS question_audit_immutable ON question_audit_records;
CREATE TRIGGER question_audit_immutable BEFORE UPDATE OR DELETE ON question_audit_records FOR EACH ROW EXECUTE FUNCTION prevent_question_append_only_mutation();
DROP TRIGGER IF EXISTS question_moderation_actions_immutable ON question_moderation_actions;
CREATE TRIGGER question_moderation_actions_immutable BEFORE UPDATE OR DELETE ON question_moderation_actions FOR EACH ROW EXECUTE FUNCTION prevent_question_append_only_mutation();

CREATE OR REPLACE FUNCTION project_question_outbox_audit()
RETURNS TRIGGER AS $$
DECLARE actor TEXT; qid TEXT; target TEXT;
BEGIN
  IF NEW.event_type NOT IN ('question.created','question.updated','question.archived','question.restored','question.relation.created','question.relation.removed','question.semantic_structure.created','question.semantic_structure.updated') THEN RETURN NEW; END IF;
  actor := COALESCE(NEW.payload->>'changedBy',NEW.payload->>'createdBy',NEW.payload->>'creatorId','system');
  qid := COALESCE(NEW.payload->>'questionId',NEW.payload->>'sourceQuestionId',NEW.aggregate_id);
  target := COALESCE(NEW.aggregate_id,qid,NEW.event_id::text);
  INSERT INTO question_audit_records (id,question_id,actor_id,action,target_type,target_id,occurred_at,correlation_id,causation_id,result,metadata,event_id)
  VALUES (gen_random_uuid()::text,qid,actor,NEW.event_type,NEW.aggregate_type,target,NEW.occurred_at,COALESCE(NEW.correlation_id,NEW.event_id::text),NEW.causation_id,'success','{}'::jsonb,NEW.event_id::text)
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS question_outbox_audit_projection ON outbox_events;
CREATE TRIGGER question_outbox_audit_projection AFTER INSERT ON outbox_events FOR EACH ROW EXECUTE FUNCTION project_question_outbox_audit();
`
};

export const questionRuntimeClosureMigration: Migration = {
  version: 8,
  name: "question_runtime_closure",
  sql: `
ALTER TABLE question_relations DROP CONSTRAINT IF EXISTS question_relations_type_check;
ALTER TABLE question_relations ADD CONSTRAINT question_relations_type_check CHECK (type IN (
  'emerges_from','refines','challenges','contradicts','depends_on','broadens','narrows',
  'alternative_to','connects','follow_up'
));
ALTER TABLE question_relations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE question_relations ADD COLUMN IF NOT EXISTS removed_by TEXT;
ALTER TABLE question_relations ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE question_relations DROP CONSTRAINT IF EXISTS question_relations_status_check;
ALTER TABLE question_relations ADD CONSTRAINT question_relations_status_check CHECK (status IN ('active','removed'));
ALTER TABLE question_relations DROP CONSTRAINT IF EXISTS question_relations_removal_metadata_check;
ALTER TABLE question_relations ADD CONSTRAINT question_relations_removal_metadata_check CHECK (
  (status='active' AND removed_by IS NULL AND removed_at IS NULL) OR
  (status='removed' AND removed_by IS NOT NULL AND removed_at IS NOT NULL)
);
ALTER TABLE question_relations DROP CONSTRAINT IF EXISTS question_relations_version_check;
ALTER TABLE question_relations ADD CONSTRAINT question_relations_version_check CHECK (version IN (1,2));

CREATE OR REPLACE FUNCTION prevent_question_relation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'question relations cannot be deleted';
  END IF;
  IF OLD.status = 'active' AND NEW.status = 'removed'
     AND NEW.version = OLD.version + 1
     AND NEW.id = OLD.id
     AND NEW.source_question_id = OLD.source_question_id
     AND NEW.target_question_id = OLD.target_question_id
     AND NEW.type = OLD.type
     AND NEW.created_by = OLD.created_by
     AND NEW.created_at = OLD.created_at THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid question relation mutation';
END;
$$ LANGUAGE plpgsql;
`
};

export const migrations: readonly Migration[] = [
  initialMigration,
  questionMigration,
  questionLifecycleMigration,
  questionRelationsMigration,
  questionSemanticStructuresMigration,
  questionDiscoveryMigration,
  questionTrustSafetyMigration,
  questionRuntimeClosureMigration
];

export async function migrate(
  client: SqlClient,
  available: readonly Migration[] = migrations
): Promise<void> {
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  );
  const applied = await client.query<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version"
  );
  const appliedVersions = new Set(applied.rows.map((row) => row.version));
  for (const migration of [...available].sort((left, right) => left.version - right.version)) {
    if (appliedVersions.has(migration.version)) continue;
    await client.query("BEGIN");
    try {
      await client.query(migration.sql);
      await client.query("INSERT INTO schema_migrations (version, name) VALUES ($1, $2)", [
        migration.version,
        migration.name
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}
