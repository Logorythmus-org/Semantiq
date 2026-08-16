# Relationships

Relationships are first-class domain objects owned by the Knowledge Graph context.

## Relationship Shape

```ts
type SemanticRelationship = {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  direction: "directed" | "bidirectional";
  strength?: number;
  confidence?: number;
  createdBy?: string;
  provenance?: string;
  createdAt: string;
  version: number;
};
```

## Relationship Types

- supports
- contradicts
- extends
- duplicates
- derived-from
- depends-on
- inspired-by
- verified-by
- question-of
- evidence-for
- experiment-of
- parent
- child
- alternative
- unknown
- future-work

## Rules

- Relationships may connect any domain object with a stable identity.
- A relationship can be proposed, accepted, rejected, superseded, or archived.
- Relationship changes emit events.
- Relationship creation uses permissions from both the source context and Knowledge Graph.
- Persistence uses graph-friendly structures, but the domain object is technology-independent.
