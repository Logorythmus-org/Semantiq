# Tool Execution

Tools allow agents to act, but every action is permissioned, audited, bounded, and recoverable.

## Supported Tool Families
Python, Git, Docker, terminal, filesystem, browser, MCP, REST, GraphQL, Google Workspace, GitHub, local AI, cloud AI, databases, and WebGPU.

## Invocation Requirements
Every tool invocation requires permission, audit, timeout, error handling, workspace isolation, and human approval when policy requires it.

## Critical Actions
Publishing, deleting, payments, repository merges, permission changes, external communication, wallet operations, sensitive research, and major workflow changes require explicit approval.

## Failure Handling
Tool failures trigger retry, fallback tool, fallback agent, checkpoint restore, alternative plan, human escalation, or partial completion.
