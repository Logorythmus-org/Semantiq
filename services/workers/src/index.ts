export interface WorkerJob {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
}
