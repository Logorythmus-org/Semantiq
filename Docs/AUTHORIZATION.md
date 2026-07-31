# Authorization

Authorization answers: can this subject perform this action on this resource in this context, and why?

## Supported Models
- RBAC: roles group permissions.
- ABAC: attributes influence decisions.
- Capability-Based Security: capabilities allow explicit actions.
- Policy-Based Authorization: declarative policies decide access.
- Context-Aware Authorization: workspace, project, device, agent, time, risk, and trust influence decisions.
- Semantic Permissions: relationships and ownership affect decisions.

## Decision Shape
Authorization decisions include allowed, reason, matched policies, missing capabilities, risk signals, and audit metadata.

## Rule
Every denial and every sensitive approval must be explainable.
