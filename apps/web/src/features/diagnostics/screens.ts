export const diagnosticsScreens = [
  { id: "error-log", title: "Local Error Log", route: "/alpha/diagnostics/errors" },
  { id: "diagnostic-bundle", title: "Diagnostic Bundle Export", route: "/alpha/diagnostics/bundle" },
  { id: "health-checks", title: "Health Checks", route: "/alpha/diagnostics/health" }
] as const;
