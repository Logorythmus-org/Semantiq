import type {
  IdentityAggregate,
  KnowledgeObjectAggregate,
  QuestionAggregate,
  WorkspaceAggregate
} from "../domain/models.js";

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

const required = (path: string, value: string | undefined): ValidationIssue[] =>
  value && value.trim().length > 0 ? [] : [{ path, message: "Required value is missing" }];

export const validateIdentity = (identity: IdentityAggregate): ValidationResult => {
  const issues = [
    ...required("id", identity.id),
    ...required("profile.displayName", identity.profile.displayName)
  ];
  return { valid: issues.length === 0, issues };
};

export const validateWorkspace = (workspace: WorkspaceAggregate): ValidationResult => {
  const issues = [
    ...required("id", workspace.id),
    ...required("ownerId", workspace.ownerId),
    ...required("name", workspace.name)
  ];
  return { valid: issues.length === 0, issues };
};

export const validateKnowledgeObject = (object: KnowledgeObjectAggregate): ValidationResult => {
  const issues = [
    ...required("id", object.id),
    ...required("workspaceId", object.workspaceId),
    ...required("title", object.title)
  ];
  return { valid: issues.length === 0, issues };
};

export const validateQuestion = (question: QuestionAggregate): ValidationResult => {
  const issues = [...required("id", question.id), ...required("text", question.text)];
  return { valid: issues.length === 0, issues };
};
