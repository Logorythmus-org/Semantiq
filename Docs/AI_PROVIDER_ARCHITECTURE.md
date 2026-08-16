# AI Provider Architecture

The AI provider layer lets Tech Club switch between local, remote, offline, hybrid, and future AI providers without changing business logic.

## Capabilities

- local models
- remote models
- offline models
- hybrid models
- streaming
- function calling
- tool calling
- structured output
- multimodal input/output
- batch processing
- fallback models
- model routing
- future providers

## Provider Contract

AI providers expose model catalog, capabilities, limits, cost hints, health, authentication requirements, and execution methods.

## Routing

Model routing selects providers based on capability, privacy mode, cost, latency, offline availability, workspace policy, and fallback rules.
