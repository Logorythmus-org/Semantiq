# Meta Relation Engine

The Meta Relation Engine defines universal explainable relationships across the Civilization Graph.

## Supported Relations

- `depends_on`
- `answers`
- `extends`
- `contradicts`
- `supports`
- `inspired_by`
- `teaches`
- `funds`
- `improves`
- `references`
- `generated_by`
- `validated_by`
- `derived_from`
- `implemented_by`

## Explanation Requirements

Every relation includes source, target, relation type, explanation, evidence, confidence, creator, and timestamp.

Relations are not hidden foreign keys. They are auditable knowledge objects that can be queried, evaluated, disputed, migrated, and preserved.

## Safety

Contradictions, uncertainty, minority interpretations, and failed validations remain visible. Consensus does not erase disagreement.
