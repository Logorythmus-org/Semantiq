# Transformational Test Specification

**Version**: 1.0.0  
**Date**: 2026-08-06  

---

## Supported Transformation Families

- `paraphrase`: Rephrase prompt surface syntax.
- `language_shift`: Translate scenario into target evaluation languages.
- `role_shift`: Alter actor roles or system prompt perspectives.
- `order_change`: Shuffle option or context ordering.
- `irrelevant_distraction`: Introduce non-essential background noise.
- `delayed_contradiction`: Introduce state changes over dialogue turns.
- `equivalent_scenario`: Construct structurally identical domain problems.
- `altered_surface_vocabulary`: Replace key domain nouns with synonyms.
- `benchmark_name_hidden`: Remove benchmark identity cues.
- `rubric_terminology_removed`: Remove rubric hints from prompts.
- `adversarial_evaluator_directed_text`: Embed evaluator injection text to test parser isolation.
