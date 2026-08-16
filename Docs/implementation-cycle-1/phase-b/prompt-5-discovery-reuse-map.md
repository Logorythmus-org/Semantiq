# Phase B Prompt 5 Discovery Reuse Map

Status: Passed.

| Existing component                                         | Decision      | Reuse in Prompt 5                                                         |
| ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| Question domain identity/lifecycle/language/source/version | KEEP          | Summary/detail fields and lifecycle predicates                            |
| Question semantic structure                                | ADAPT         | Frame-compatible presence, freshness, component counts, uncertainty level |
| Question relations and symmetric-type rules                | KEEP/ADAPT    | one-hop participation, direction, related-to, relation count              |
| PostgreSQL pool/migration client                           | KEEP          | migration 6 and read repository                                           |
| Unit-of-work command repositories                          | KEEP          | unchanged write behavior and generated search synchronization             |
| API envelopes/correlation/error mapping                    | KEEP          | unified collection and detail routes                                      |
| memory repositories/app composition                        | ADAPT         | deterministic contract/unit/API tests                                     |
| shared page-number pagination                              | KEEP SEPARATE | not compatible with keyset discovery                                      |
| question-network search/feed                               | DEPRECATE     | no reuse; incompatible historical aggregate and ranking scope             |
| generic SearchIndex/search service                         | DEFER         | no operational implementation or current consumer                         |
| graph traversal API                                        | KEEP SEPARATE | remains owner of bounded multi-hop traversal                              |

No duplicate operational search service was created. The read layer is part of the authoritative Question Runtime and uses the existing database. Legacy scaffolds remain unchanged to avoid an unrelated package rewrite; their removal/ownership consolidation is documented technical debt.
