export interface JsonSchema {
  readonly $schema: "https://json-schema.org/draft/2020-12/schema";
  readonly title: string;
  readonly type: "object";
  readonly required: readonly string[];
  readonly properties: Readonly<Record<string, unknown>>;
}

export const coreOpenApiContract = {
  openapi: "3.1.0",
  info: {
    title: "Tech Club Core Domain API",
    version: "0.0.0"
  },
  paths: {}
} as const;

export const identityJsonSchema: JsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "IdentityAggregate",
  type: "object",
  required: ["id", "profile", "verificationStatus", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    profile: { type: "object" },
    verificationStatus: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" }
  }
};

export const graphqlSchema = `
type Identity {
  id: ID!
  displayName: String!
  verificationStatus: String!
}

type Workspace {
  id: ID!
  name: String!
  ownerId: ID!
}

type KnowledgeObject {
  id: ID!
  title: String!
  kind: String!
}

type Question {
  id: ID!
  text: String!
  status: String!
}
`;
