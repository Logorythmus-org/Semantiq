# Verb Taxonomy Design Rationale

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Design Rationale

1. **Action vs Modality**: Classifying actions by observable impact (e.g. `execute` vs `generate`) allows safety rubrics to evaluate real-world risk independently of LLM prompt text.
2. **Provider Neutrality**: Verbs map tool calls across Ollama, OpenAI, Anthropic, and custom CLI runners into a single canonical vocabulary.
3. **No Private CoT**: Taxonomy classifies external observable events only. Internal reasoning chain-of-thought is neither required nor stored.
