# Multi-Agent Orchestration

The Agent Orchestrator coordinates specialized agents under explicit, observable workflow rules.

## Supported Modes

- Sequential execution for dependent task chains.
- Parallel execution for independent subtasks.
- Hierarchical planning with supervisor agents.
- Peer collaboration for shared research or design.
- Delegation when an agent lacks capability or context.
- Negotiation when agents propose competing plans.
- Voting for bounded decision support.
- Consensus for evidence-backed agreement.
- Conflict resolution with minority reports.
- Human intervention for sensitive or ambiguous decisions.
- Nested workflows for complex goals.

## Agent Assignment

Assignments bind a goal, task, agent, required capability, context bundle, tool permissions, validation criteria, and approval requirements.

## Collaboration Rules

Agents communicate through events, messages, shared context, shared memory, task delegation, knowledge requests, resource requests, benchmark requests, and conflict-resolution records. All communication is observable.

## Supervisor Behavior

Supervisor agents coordinate, summarize, validate, and escalate. They do not silently override human approval policies.
