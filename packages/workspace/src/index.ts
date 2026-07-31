export type * from "./contracts.js";
export {
  WorkspaceApplicationService,
  MemoryWorkspaceRepository,
  createWorkspaceAggregate,
  type WorkspaceAggregate,
  type WorkspaceRepository,
  type WorkspaceId
} from "../../core/src/index.js";

import type { KnowledgeObject, Project, Workspace, WorkspaceRepository } from "./contracts.js";

export interface WorkspaceRef {
  readonly id: string;
  readonly name: string;
  readonly localPath?: string;
}

export interface WorkspaceLifecycle {
  open(workspace: WorkspaceRef): Promise<void>;
  close(workspaceId: string): Promise<void>;
}

export class LocalWorkspaceRepository implements WorkspaceRepository {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly projects = new Map<string, Project>();
  private readonly objects = new Map<string, KnowledgeObject>();

  async saveWorkspace(workspace: Workspace): Promise<void> {
    this.workspaces.set(workspace.id, workspace);
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async saveProject(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async saveObject(object: KnowledgeObject): Promise<void> {
    this.objects.set(object.id, object);
  }

  async getObject(id: string): Promise<KnowledgeObject | undefined> {
    return this.objects.get(id);
  }
}
