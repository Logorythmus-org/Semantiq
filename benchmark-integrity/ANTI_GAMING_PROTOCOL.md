# Anti-Gaming Protocol

**Version**: 1.0.0  
**Date**: 2026-08-06

---

## Anti-Gaming Measures

1. **Prompt Sensitivity Checks**: Evaluate model behavior under surface paraphrases.
2. **Benchmark Name Anonymization**: Strip explicit benchmark names to prevent prompt-dependent memorization.
3. **Performative Over-Refusal Prevention**: Detect artificially verbose or performative evasions.
4. **Evaluator Injection Hardening**: Treat all model outputs strictly as data inputs to evaluator prompts.
