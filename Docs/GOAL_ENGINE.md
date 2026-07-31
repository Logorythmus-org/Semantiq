# Goal Engine

The Goal Engine makes goals the primary execution object in Tech Club.

## Goal Contract
Each goal contains identity, description, priority, context, requirements, dependencies, constraints, resources, workspace, owner, agent assignments, progress, benchmark references, risks, expected outcome, completion criteria, history, reflection, and version.

## Goal Lifecycle
Created -> Interpreted -> Planned -> Assigned -> Executing -> Validating -> Benchmarking -> Reflecting -> Learning -> Completed -> Archived.

## Goal Versioning
Goals are immutable by version. Changes create a new version with an explanation, actor, timestamp, and relationship to prior goal state.

## Completion Criteria
Completion requires satisfied requirements, validated tasks, Semantiq benchmark results, reflection, memory update, and graph persistence.

## Human Control
Major workflow changes create a pending approval state before the runtime continues.
