import type { Page, PageRequest, Repository } from "../../shared/src/index.js";
import type { SqlClient } from "./client.js";

export interface SystemMetadataRecord {
  readonly id: string;
  readonly value: unknown;
  readonly updatedAt: Date;
}
export class SystemMetadataRepository implements Repository<SystemMetadataRecord> {
  private readonly client: SqlClient;
  constructor(client: SqlClient) {
    this.client = client;
  }
  async getById(id: string): Promise<SystemMetadataRecord | undefined> {
    const result = await this.client.query<{ key: string; value: unknown; updated_at: Date }>(
      "SELECT key, value, updated_at FROM system_metadata WHERE key = $1",
      [id]
    );
    const row = result.rows[0];
    return row ? { id: row.key, value: row.value, updatedAt: new Date(row.updated_at) } : undefined;
  }
  async add(value: SystemMetadataRecord): Promise<void> {
    await this.client.query(
      "INSERT INTO system_metadata (key, value, updated_at) VALUES ($1, $2, $3)",
      [value.id, value.value, value.updatedAt]
    );
  }
  async update(value: SystemMetadataRecord): Promise<void> {
    const result = await this.client.query(
      "UPDATE system_metadata SET value = $2, updated_at = $3 WHERE key = $1",
      [value.id, value.value, value.updatedAt]
    );
    if (result.rowCount !== 1) throw new Error(`Metadata record not found: ${value.id}`);
  }
  async remove(id: string): Promise<void> {
    await this.client.query("DELETE FROM system_metadata WHERE key = $1", [id]);
  }
  async exists(id: string): Promise<boolean> {
    const result = await this.client.query("SELECT 1 FROM system_metadata WHERE key = $1", [id]);
    return result.rowCount === 1;
  }
  async list(request: PageRequest = { page: 1, limit: 25 }): Promise<Page<SystemMetadataRecord>> {
    const offset = (request.page - 1) * request.limit;
    const result = await this.client.query<{
      key: string;
      value: unknown;
      updated_at: Date;
      total: string;
    }>(
      "SELECT key, value, updated_at, COUNT(*) OVER() AS total FROM system_metadata ORDER BY key ASC LIMIT $1 OFFSET $2",
      [request.limit, offset]
    );
    const total = Number(result.rows[0]?.total ?? 0);
    return {
      items: result.rows.map((row) => ({
        id: row.key,
        value: row.value,
        updatedAt: new Date(row.updated_at)
      })),
      page: request.page,
      limit: request.limit,
      total,
      hasNext: offset + result.rows.length < total,
      hasPrevious: request.page > 1
    };
  }
}
