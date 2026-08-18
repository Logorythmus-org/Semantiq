export interface StructuredLogger {
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  warn(message: string, context?: Readonly<Record<string, unknown>>): void;
  error(message: string, context?: Readonly<Record<string, unknown>>): void;
}

export interface Tracer {
  startSpan(
    name: string,
    attributes?: Readonly<Record<string, unknown>>
  ): { readonly id: string; end(): void };
}

export interface Metrics {
  increment(name: string, value?: number, labels?: Readonly<Record<string, string>>): void;
  observe(name: string, value: number, labels?: Readonly<Record<string, string>>): void;
}

export interface EncryptionPort {
  encrypt(data: Uint8Array, scope: string): Promise<Uint8Array>;
  decrypt(data: Uint8Array, scope: string): Promise<Uint8Array>;
}

export interface SearchIndex<TDocument> {
  index(document: TDocument): Promise<void>;
  search(query: string, limit: number): Promise<readonly TDocument[]>;
}

export interface CacheProvider<TValue> {
  get(key: string): Promise<TValue | undefined>;
  set(key: string, value: TValue, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ConfigurationService<TConfig> {
  load(): Promise<TConfig>;
  get<TKey extends keyof TConfig>(key: TKey): TConfig[TKey];
}
