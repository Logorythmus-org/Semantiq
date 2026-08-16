# WebGPU Runtime

The WebGPU Runtime accelerates local browser and desktop compute when available.

## Supported Workloads
Parallel compute, matrix operations, graph processing, simulation, embeddings, visualization, rendering, scientific computing, AI preprocessing, Knowledge Graph layout, and future AI acceleration.

## Fallback
WebGPU is optional. If unavailable, work falls back to CPU, workers, local GPU adapters, server-side adapters, or queued execution depending on policy.

## Safety
WebGPU workloads must declare resource requirements, memory limits, timeout policy, fallback behavior, and benchmark expectations.

## Observability
The runtime tracks WebGPU availability, adapter info, memory pressure, execution time, fallback reason, and result integrity.
