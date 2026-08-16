export const synchronizationScreens = ["Replication Planner", "Synchronization Center"] as const;
export const syncStates = [
  "Idle",
  "Checking",
  "Planning",
  "Awaiting Approval",
  "Synchronizing",
  "Paused",
  "Completed",
  "Partially Completed",
  "Conflict",
  "Failed",
  "Cancelled"
] as const;
