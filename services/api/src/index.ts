export const apiService = {
  name: "api",
  health: "healthy",
  endpoint: "/health",
  mvp: true
} as const;

export {
  createApiApplication,
  type ApiApplication,
  type ApiHealthComponent,
  type ApiServerOptions
} from "./server.js";
