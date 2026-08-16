# Experiment Registry

Spec ID: S7-EXP

Every experiment stores ID, question, hypothesis, target users, method, evidence, thresholds, privacy implications, duration, owner, result and decision.

## Required Fields

- Stable ID
- Question
- Hypothesis
- Target users
- Method
- Evidence required
- Success threshold
- Failure threshold
- Privacy implications
- Duration
- Owner
- Result
- Decision

## Initial Experiments

| ID         | Question                                                       | Hypothesis                                                           | Target Users                                       | Method                         | Evidence Required                        | Success Threshold                     | Failure Threshold                   | Privacy Implications                                          | Duration | Owner         | Result      | Decision |
| ---------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ | ---------------------------------------- | ------------------------------------- | ----------------------------------- | ------------------------------------------------------------- | -------- | ------------- | ----------- | -------- |
| EXP-S7-001 | Do users understand Semantiq better with words before numbers? | Words-first framing reduces over-trust in scores.                    | Non-technical, student, research-oriented          | Moderated usability comparison | Task observation, Semantiq feedback      | 70% explain score as advisory         | 50% treat score as absolute         | No private content by default; optional comment with consent  | 1 week   | product-lead  | Not Started | Pending  |
| EXP-S7-002 | Do example questions help first-question creation?             | Marked examples reduce empty-state abandonment.                      | AI-inexperienced, student, knowledge worker        | First-run task observation     | Completion, abandonment, confusion notes | 80% draft a meaningful first question | 50% abandon or copy example blindly | Anonymous metrics; question content excluded unless consented | 1 week   | ux-lead       | Not Started | Pending  |
| EXP-S7-003 | Does local-first messaging increase trust?                     | Clear ownership language increases confidence without slowing setup. | Privacy-sensitive, founder, educator               | Interview plus onboarding task | Confidence rating, recall check          | 70% can explain workspace ownership   | 40% cannot explain local ownership  | Interview consent required for quotes                         | 1 week   | research-lead | Not Started | Pending  |
| EXP-S7-004 | Are approval dialogs understandable?                           | Action-specific approval copy reduces unsafe approvals.              | Developer, AI-inexperienced, community facilitator | Workflow usability session     | Approval decision, explanation, errors   | 80% correctly deny risky request      | 30% approve without understanding   | No prompt content retained by default                         | 1 week   | safety-lead   | Not Started | Pending  |
