# Question Pagination

Primary discovery uses keyset cursors.

| Contract          | Value                      |
| ----------------- | -------------------------- |
| Default page size | 20                         |
| Maximum page size | 100                        |
| Fetch size        | requested size plus one    |
| Default order     | `created_at DESC, id DESC` |
| Cursor maximum    | 512 characters             |
| Total count       | not returned               |

Supported sort modes are `newest`, `oldest`, and `recently_updated`. They map to `(created_at DESC, id DESC)`, `(created_at ASC, id ASC)`, and `(updated_at DESC, id DESC)` respectively.

The opaque base64url cursor contains schema version 1, controlled sort, normalized timestamp, tie-breaker Question ID, and a truncated SHA-256 hash of the normalized filters/sort. A cursor is rejected when malformed, non-canonical, oversized, version-incompatible, sort-mismatched, or reused with different filters/search text.

The page envelope is `{ items, page: { nextCursor, hasMore, limit }, query: { sort } }`. `nextCursor` is absent and `hasMore` is false at the end. Invalid limits are rejected rather than clamped.

Keyset pagination is deterministic for unchanged ordering keys and avoids deep offset scans. It does not create a cross-request database snapshot; a concurrent update can move a row in recently-updated ordering.
