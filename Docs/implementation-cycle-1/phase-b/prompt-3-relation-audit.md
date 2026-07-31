# Phase B Prompt 3 Relation Audit

## Authoritative Baseline

No Prompt 1/2 relation persistence or API existed. The authoritative Question aggregate contained no embedded relation IDs, which is compatible with a separate relation aggregate.

## Historical Implementations

| Location                         | Useful input                                  | Conflict or limitation                                      | Prompt 3 treatment    |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------- | --------------------- |
| `packages/question-network`      | Relation vocabulary and adjacency lookup idea | Separate oversized Question model and lifecycle vocabulary  | Reference only        |
| `packages/question-intelligence` | Suggested relation vocabulary                 | Suggestions, confidence, and AI workflow are not assertions | No runtime dependency |
| `packages/core`                  | Generic directed edge and event concepts      | Uses Knowledge IDs and a second Question aggregate          | Reference only        |
| `packages/graph`                 | Generic node/edge exports                     | No Question invariants or persistence                       | Not imported          |
| `packages/graph-runtime`         | Neighborhood and path prototypes              | In-memory knowledge model and Neo4j-era assumptions         | Not imported          |
| Existing parent/reply models     | Hierarchical interaction semantics            | Not equivalent to Question relations                        | No mapping            |

## Vocabulary Mapping

- Historical `derived_from` maps conceptually to `emerges_from`.
- Historical `extends` may map to `refines` only with human context.
- Historical `generalizes` maps to `broadens`.
- Historical `specializes` maps to `narrows`.
- `contradicts`, `depends_on`, and `alternative_to` retain their meaning.
- Historical `supports`, `duplicates`, `part_of`, `causes`, `explains`, and `future_work` are not accepted Prompt 3 types.

No automatic data or code adapter was justified because none of the historical stores is authoritative or populated by the Prompt 1/2 runtime.
