# Question Discovery API

## Endpoints

| Method and path                     | Result                                 |
| ----------------------------------- | -------------------------------------- |
| `GET /api/v1/questions`             | list or text-search Question summaries |
| `GET /api/v1/questions/{id}/detail` | bounded Question detail read model     |

`GET /questions` unifies listing and search. Supplying non-empty `q` selects database text search; omitting `q`, or supplying only whitespace after normalization, performs listing with all other filters preserved.

Supported query parameters are `q`, `status`, `creator_id`, `created_after`, `created_before`, `updated_after`, `updated_before`, `language`, `has_frame`, `frame_stale`, `has_assumptions`, `has_unknowns`, `uncertainty_type`, `constraint_type`, `relation_type`, `relation_direction`, `related_to_question_id`, `sort`, `cursor`, and `limit`. Parameters may appear at most once.

Successful collection data is:

```json
{
  "items": [],
  "page": { "nextCursor": null, "hasMore": false, "limit": 20 },
  "query": { "sort": "newest" }
}
```

The standard API envelope adds correlation metadata. Optional values omitted by the TypeScript model may serialize as absent rather than `null`.

Stable discovery errors include `question_query_invalid`, `question_query_too_long`, `question_page_size_invalid`, `question_cursor_invalid`, `question_sort_invalid`, `question_filter_invalid`, `question_time_range_invalid`, `question_language_invalid`, `question_uncertainty_filter_invalid`, `question_constraint_filter_invalid`, `question_relation_filter_invalid`, `question_not_found`, and retryable sanitized `question_search_unavailable`.

Discovery currently follows the existing public Question-read policy. It must not be exposed directly to untrusted traffic until Prompt 6 defines authentication, visibility, and enumeration controls.
