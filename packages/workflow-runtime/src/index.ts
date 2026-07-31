/**
 * @deprecated Prompt 2 normalized workflow ownership to `@tech-club/workflow`.
 * This package remains as a compatibility import path until downstream imports
 * have migrated.
 */
export type {
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowNodeType
} from "../../workflow/src/index.js";
