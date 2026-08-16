export interface DataciteMetadata {
  readonly identifier: { readonly identifier: string; readonly identifierType: "DOI" };
  readonly creators: readonly {
    readonly name: string;
    readonly nameType?: "Organizational" | "Personal";
  }[];
  readonly titles: readonly { readonly title: string }[];
  readonly publisher: string;
  readonly publicationYear: number;
  readonly resourceType: {
    readonly resourceType: string;
    readonly resourceTypeGeneral: "Software" | "Dataset";
  };
  readonly schemaVersion: "http://datacite.org/schema/kernel-4";
}

export function formatDataciteMetadata(
  doi: string,
  title: string,
  year: number = 2026,
  creatorName: string = "Tech Club Foundation"
): DataciteMetadata {
  return {
    identifier: { identifier: doi, identifierType: "DOI" },
    creators: [{ name: creatorName, nameType: "Organizational" }],
    titles: [{ title }],
    publisher: "Zenodo",
    publicationYear: year,
    resourceType: { resourceType: "Software Evaluation Toolkit", resourceTypeGeneral: "Software" },
    schemaVersion: "http://datacite.org/schema/kernel-4"
  };
}

export function formatOpenAlexMetadata(
  doi: string,
  title: string,
  year: number = 2026
): Record<string, unknown> {
  return {
    id: `https://openalex.org/${doi}`,
    doi: `https://doi.org/${doi}`,
    title,
    publication_year: year,
    type: "software",
    open_access: { is_oa: true, oa_status: "gold" }
  };
}
