# Node System

Nodes are modular workflow execution units.

## Node Types
Goal, question, agent, task, decision, condition, loop, parallel, merge, approval, tool, repository, workspace, knowledge graph, Semantiq, memory, notification, delay, and custom nodes.

## Node Contract
Every node defines inputs, outputs, configuration, validation, execution status, logs, retry policy, permissions, and optional approval policy references.

## Approval Nodes
Approval nodes pause execution until a human approves critical actions such as publishing, deletion, repository merge, external API calls, payments, sensitive data handling, research publication, wallet actions, or organization policy changes.

## Tool Nodes
Tool nodes execute through sandboxed, audited adapters. Supported families include Python, Docker, Git, GitHub, filesystem, database, REST, GraphQL, browser, MCP, Google Workspace, WebGPU, CLI, local AI, and cloud AI.
