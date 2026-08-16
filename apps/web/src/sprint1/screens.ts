export const sprint1FrontendStack = {
  framework: "Next.js / React",
  styling: "Tailwind CSS",
  data: "TanStack Query",
  graph: "interactive graph viewer descriptor",
  state: "local-first runtime state with future sync adapters"
} as const;

export const sprint1Navigation = [
  "Sidebar",
  "Top Nav",
  "Workspace Switcher",
  "Breadcrumbs",
  "Recent Objects",
  "Search",
  "Command Palette"
] as const;

export const sprint1ScreenDescriptors = [
  { id: "welcome", title: "Welcome", route: "/", primaryAction: "Create local identity" },
  { id: "identity-setup", title: "Identity Setup", route: "/identity/setup", primaryAction: "Save profile" },
  { id: "workspace-list", title: "Workspace List", route: "/workspaces", primaryAction: "Create workspace" },
  { id: "workspace-dashboard", title: "Workspace Dashboard", route: "/workspaces/:workspaceId", primaryAction: "Create question" },
  { id: "question-editor", title: "Question Editor", route: "/workspaces/:workspaceId/questions/:questionId", primaryAction: "Save question" },
  { id: "knowledge-editor", title: "Knowledge Editor", route: "/workspaces/:workspaceId/knowledge/:knowledgeId", primaryAction: "Save object" },
  { id: "graph-viewer", title: "Graph Viewer", route: "/workspaces/:workspaceId/graph", primaryAction: "Filter graph" },
  { id: "search", title: "Search", route: "/workspaces/:workspaceId/search", primaryAction: "Run search" },
  { id: "settings", title: "Settings", route: "/settings", primaryAction: "Save settings" },
  { id: "export", title: "Export", route: "/workspaces/:workspaceId/export", primaryAction: "Export workspace" },
  { id: "not-found", title: "404", route: "/404", primaryAction: "Return home" },
  { id: "error", title: "Error", route: "/error", primaryAction: "Retry" },
  { id: "loading", title: "Loading", route: "/loading", primaryAction: "Wait" }
] as const;

export const sprint1DashboardPanels = [
  "Recent Questions",
  "Recent Knowledge",
  "Workspace Statistics",
  "Semantiq Placeholder",
  "Graph Summary",
  "Recent Activity",
  "Tasks",
  "Notifications",
  "Agent Status Placeholder"
] as const;
