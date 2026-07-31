# Kernel Architecture

The Platform Kernel is the internal operating environment beneath Tech Club. Applications, modules, agents, plugins, and future distributed workers communicate through the kernel instead of directly coupling to one another.

## Kernel Layers
- Kernel: public runtime facade used by applications and modules.
- Core Runtime: bootstraps registries, configuration, lifecycle, diagnostics, and security.
- Service Registry: records service descriptors, capabilities, versions, and factories.
- Dependency Injection: resolves services through explicit lifecycles and named contracts.
- Lifecycle Manager: installs, initializes, configures, starts, pauses, resumes, stops, unloads, upgrades, checks health, and shuts down modules.
- Configuration Manager: loads typed immutable configuration by environment, workspace, project, user, module, and plugin scope.
- Plugin Manager: validates, registers, starts, stops, and isolates extensions.
- Message Bus: routes commands, queries, events, notifications, broadcasts, request/response messages, scheduled messages, and dead letters.
- Scheduler: runs immediate, delayed, cron, workflow, and agent tasks with retry, cancellation, priority, and timeout metadata.
- Event Engine: publishes, subscribes, stores, filters, replays, correlates, and audits events.
- Resource Manager: tracks memory, CPU, GPU, workers, local AI, external AI, files, repositories, caches, and connections.
- Diagnostics: collects logs, metrics, traces, timelines, profiles, warnings, and errors.
- Application Modules: domain and product modules registered through contracts.

## Kernel Rule
No business logic belongs inside the kernel. The kernel manages runtime concerns; modules own domain behavior.

## Local-First Runtime
The default kernel runs in-process with local memory and local persistence adapters. Distributed behavior is an adapter concern, not a domain requirement.

## Package File Structure
- `packages/kernel/src/contracts.ts`: runtime interfaces for modules, services, DI, events, messages, scheduler, plugins, resources, configuration, permissions, health, and the platform facade.
- `packages/kernel/src/index.ts`: local in-memory kernel implementation for development, testing, and future adapter validation.
- Future directories: `runtime/`, `registry/`, `di/`, `events/`, `scheduler/`, `plugins/`, `config/`, `logging/`, `monitoring/`, `health/`, `security/`, `diagnostics/`, and `resources/` may split implementations as the package grows.
