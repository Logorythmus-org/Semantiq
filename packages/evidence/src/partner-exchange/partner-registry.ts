/**
 * @package @semantiq/evidence
 * Partner Organization Registry Engine
 */

import { computeSha256, PartnerRole } from "../../../sandbox-contracts/src/index.js";
import type { PartnerOrganization, PartnerTrustTier } from "./types.js";

export interface RegisterPartnerOptions {
  readonly id?: string | undefined;
  readonly name: string;
  readonly role: PartnerRole;
  readonly trustTier?: PartnerTrustTier | undefined;
  readonly contactEmail: string;
  readonly publicKey?: string | undefined;
  readonly endpointUrl?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export class PartnerOrganizationRegistry {
  private readonly organizations = new Map<string, PartnerOrganization>();

  constructor() {
    // Seed standard initial verified partners
    this.registerOrganization({
      id: "org_semantiq_foundation",
      name: "SemantIQ Foundation",
      role: PartnerRole.BENCHMARK_CONTRIBUTOR,
      trustTier: "certified_consortium",
      contactEmail: "consortium@semantiq.org"
    });
  }

  public registerOrganization(options: RegisterPartnerOptions): PartnerOrganization {
    const id = options.id ?? `org_${computeSha256(options.name).slice(0, 16)}`;
    const organization: PartnerOrganization = {
      id,
      name: options.name,
      role: options.role,
      trustTier: options.trustTier ?? "registered",
      contactEmail: options.contactEmail,
      publicKey: options.publicKey,
      endpointUrl: options.endpointUrl,
      registeredAt: new Date().toISOString(),
      metadata: options.metadata ? Object.freeze({ ...options.metadata }) : undefined
    };

    const frozen = Object.freeze(organization);
    this.organizations.set(id, frozen);
    return frozen;
  }

  public getOrganization(id: string): PartnerOrganization | undefined {
    return this.organizations.get(id);
  }

  public listOrganizations(filter?: {
    role?: PartnerRole | undefined;
    trustTier?: PartnerTrustTier | undefined;
  }): readonly PartnerOrganization[] {
    let list = Array.from(this.organizations.values());
    if (filter?.role) {
      list = list.filter((o) => o.role === filter.role);
    }
    if (filter?.trustTier) {
      list = list.filter((o) => o.trustTier === filter.trustTier);
    }
    return Object.freeze(list);
  }
}
