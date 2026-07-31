export interface RuntimeMetric {
  readonly name: string;
  readonly value: number;
  readonly labels: Readonly<Record<string, string>>;
  readonly observedAt: string;
}
