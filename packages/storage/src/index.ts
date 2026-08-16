export interface StorageRecord<TValue = unknown> {
  readonly key: string;
  readonly value: TValue;
  readonly updatedAt: string;
}

export interface StoragePort {
  read<TValue>(key: string): Promise<StorageRecord<TValue> | undefined>;
  write<TValue>(record: StorageRecord<TValue>): Promise<void>;
}
