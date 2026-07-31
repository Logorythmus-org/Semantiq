import {
  IdentityApplicationService,
  MemoryEventBus,
  WorkspaceApplicationService,
  createMemoryUnitOfWork
} from "../src/index.js";

const unitOfWork = createMemoryUnitOfWork();
const eventBus = new MemoryEventBus();
const identityService = new IdentityApplicationService(unitOfWork, eventBus);
const workspaceService = new WorkspaceApplicationService(unitOfWork, eventBus);

await identityService.registerIdentity("identity:example", "Example User", "example", { correlationId: "example" });
await workspaceService.createWorkspace("workspace:example", "identity:example", "Example Workspace", { correlationId: "example" });
