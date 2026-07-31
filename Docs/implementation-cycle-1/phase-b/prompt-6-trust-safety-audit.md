# Prompt 6 Trust and Safety Audit

| Area       | Existing artifact                   | Finding                                                      | Decision                                        |
| ---------- | ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Identity   | `packages/identity`                 | Generic in-memory authorization/audit; not wired to Question | WRAP concept through narrow capability contract |
| Moderation | `packages/question-network`         | Incompatible case/flag model and lifecycle                   | DEPRECATE for Question Runtime                  |
| Trust      | `packages/community-engine`         | Reputation/policy model would collapse boundaries            | DEFER_TO_PUBLIC_ALPHA                           |
| Provenance | civilization/data/evidence packages | Generic lineage/evidence, no Question aggregate ownership    | ADAPT concepts only                             |
| Audit      | logs and outbox                     | Logs non-authoritative; outbox transactional                 | KEEP outbox, add authoritative audit            |
| Rate limit | gateway/auth documentation          | Claims/scaffolds, no composed enforcement                    | IMPLEMENT local bounded limiter                 |
| Deletion   | lifecycle archive                   | No permanent delete path                                     | KEEP and document boundary                      |

Sensitive fields identified: source descriptions, reports/reporter IDs, moderator identity/reasons, audit metadata, and idempotency keys. Public contracts exclude reports, audit identities, removed provenance, and raw limiter keys.
