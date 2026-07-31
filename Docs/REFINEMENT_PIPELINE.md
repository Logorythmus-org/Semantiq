# Refinement Pipeline

The refinement pipeline is modular and approval-based.

## Pipeline
Raw User Input -> Language Detection -> Intent Extraction -> Context Extraction -> Ambiguity Analysis -> Assumption Analysis -> Semantic Tagging -> Related Question Search -> Duplicate Detection -> Evidence Gap Detection -> Refinement Suggestions -> Semantiq Preview -> User Approval -> Question Update.

## Rules
- Each step emits explainable output.
- Steps can run offline when local context is available.
- Failed steps produce warnings rather than silent changes.
- Question update happens only after approval.
