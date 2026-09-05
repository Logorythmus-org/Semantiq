import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Ajv } from "ajv";
import {
  canonicalJson,
  canonicalizeV1,
  computeSha256,
  SHARED_CANONICALIZATION_PROFILE,
  type ResearchBundle
} from "../../packages/sandbox-contracts/src/index.js";
import {
  createWorkspaceComponentV1IdentityPreimage,
  hashWorkspaceComponentV1,
  ResearchBundleBuilder,
  ResearchBundleVerifier,
  WORKSPACE_COMPONENT_VERIFICATION_FAILURE,
  WORKSPACE_SNAPSHOT_COMPONENT_PATH,
  type WorkspaceSnapshot
} from "../../packages/evidence/src/research-bundles/index.js";

interface ComponentFixture {
  artifactVersion: string;
  path: string;
  payload: WorkspaceSnapshot;
  expectedCanonicalUtf8?: string;
  expectedPayloadCanonicalUtf8?: string;
  identityPreimage?: unknown;
  expectedIdentityCanonicalUtf8?: string;
  expectedDigest: string;
  component: ResearchBundle["includedArtifacts"][number];
  otherComponent: { path: string; payload: string; sha256: string };
  expectedRootInput: string;
  expectedRoot: string;
  expectedVerification: boolean;
}

const root = resolve(import.meta.dirname, "../..");
const readFixture = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(resolve(root, relativePath), "utf8")) as T;

const legacy = readFixture<ComponentFixture>(
  "tests/fixtures/research-bundle/workspace/legacy/workspace-component.json"
);
const v1 = readFixture<ComponentFixture>(
  "tests/fixtures/research-bundle/workspace/v1/workspace-component.json"
);
const strippedAttack = readFixture<{
  component: ResearchBundle["includedArtifacts"][number];
  expectedVerification: boolean;
  expectedFailure: string;
}>("tests/fixtures/research-bundle/workspace/attacks/stripped-profile.json");

const makeBundle = (
  fixture: ComponentFixture,
  component: ResearchBundle["includedArtifacts"][number] = fixture.component,
  overrides: Partial<ResearchBundle> = {}
): ResearchBundle => ({
  id: "bundle_workspace_fixture",
  version: fixture.artifactVersion,
  studyId: "study_workspace_fixture",
  pepArchiveUri: "urn:semantiq:bundle:workspace-fixture",
  merkleRootHash: fixture.expectedRoot,
  includedArtifacts: [
    component,
    {
      path: fixture.otherComponent.path,
      sha256: fixture.otherComponent.sha256,
      mediaType: "application/json"
    }
  ],
  license: "MIT",
  createdTimestamp: "2026-09-05T12:00:00.000Z",
  ...overrides
});

const makeArtifacts = (fixture: ComponentFixture): ReadonlyMap<string, string> =>
  new Map([
    [fixture.path, fixture.expectedPayloadCanonicalUtf8 ?? fixture.expectedCanonicalUtf8!],
    [fixture.otherComponent.path, fixture.otherComponent.payload]
  ]);

const verify = (
  fixture: ComponentFixture,
  component: ResearchBundle["includedArtifacts"][number] = fixture.component,
  overrides: Partial<ResearchBundle> = {},
  artifacts = makeArtifacts(fixture)
) =>
  new ResearchBundleVerifier().verifyBundle(makeBundle(fixture, component, overrides), artifacts);

describe("profile-bound ResearchBundle workspace component canonicalization", () => {
  it("freezes exact legacy bytes, digest, root contribution, root, and verification", () => {
    expect(canonicalJson(legacy.payload)).toBe(legacy.expectedCanonicalUtf8);
    expect(computeSha256(legacy.expectedCanonicalUtf8!)).toBe(legacy.expectedDigest);
    expect(
      [
        `${legacy.component.path}:${legacy.component.sha256}`,
        `${legacy.otherComponent.path}:${legacy.otherComponent.sha256}`
      ]
        .sort()
        .join("|")
    ).toBe(legacy.expectedRootInput);
    expect(computeSha256(legacy.expectedRootInput)).toBe(legacy.expectedRoot);
    expect(verify(legacy).isValid).toBe(legacy.expectedVerification);
    expect(legacy.component.canonicalization).toBeUndefined();
  });

  it("freezes the V1 payload, profile-bound preimage, digest, root, and verification", () => {
    expect(canonicalizeV1(v1.payload)).toBe(v1.expectedPayloadCanonicalUtf8);
    expect(createWorkspaceComponentV1IdentityPreimage(v1.payload)).toEqual(v1.identityPreimage);
    expect(canonicalizeV1(v1.identityPreimage)).toBe(v1.expectedIdentityCanonicalUtf8);
    expect(hashWorkspaceComponentV1(v1.payload).sha256).toBe(v1.expectedDigest);
    expect(computeSha256(v1.expectedRootInput)).toBe(v1.expectedRoot);
    expect(verify(v1).isValid).toBe(v1.expectedVerification);
    expect(v1.component.canonicalization).toEqual({
      profile: SHARED_CANONICALIZATION_PROFILE,
      hashAlgorithm: "sha256"
    });
  });

  it("proves profile binding separates equal payload bytes and defeats metadata stripping", () => {
    expect(v1.expectedPayloadCanonicalUtf8).toBe(legacy.expectedCanonicalUtf8);
    expect(v1.expectedDigest).not.toBe(legacy.expectedDigest);

    const result = verify(v1, strippedAttack.component);
    expect(result.isValid).toBe(strippedAttack.expectedVerification);
    expect(result.violations.join("\n")).toContain(strippedAttack.expectedFailure);
    expect(result.violations.join("\n")).not.toContain("UNKNOWN_CANONICALIZATION_PROFILE");
  });

  it("keeps default generation legacy and makes secure V1 generation explicit", () => {
    const builder = new ResearchBundleBuilder();
    const base = {
      bundleId: "bundle_generation_fixture",
      title: "Workspace fixture",
      author: "SemantIQ",
      workspaceSnapshot: v1.payload
    } as const;
    const legacyBuilt = builder.buildBundle(base);
    const firstV1 = builder.buildBundle({
      ...base,
      workspaceSnapshotCanonicalization: SHARED_CANONICALIZATION_PROFILE
    });
    const secondV1 = builder.buildBundle({
      ...base,
      workspaceSnapshotCanonicalization: SHARED_CANONICALIZATION_PROFILE
    });

    const legacyComponent = legacyBuilt.manifest.componentArtifacts[0]!;
    const v1Component = firstV1.manifest.componentArtifacts[0]!;
    expect(legacyBuilt.artifacts.get(WORKSPACE_SNAPSHOT_COMPONENT_PATH)).toBe(
      legacy.expectedCanonicalUtf8
    );
    expect(legacyComponent.sha256).toBe(legacy.expectedDigest);
    expect(legacyComponent.canonicalization).toBeUndefined();
    expect(v1Component.sha256).toBe(v1.expectedDigest);
    expect(v1Component.canonicalization?.profile).toBe(SHARED_CANONICALIZATION_PROFILE);
    expect(secondV1.manifest.componentArtifacts[0]).toEqual(v1Component);
    expect(secondV1.bundle.merkleRootHash).toBe(firstV1.bundle.merkleRootHash);
  });

  it("accepts an explicit mixed-profile bundle without globally labeling the container", () => {
    const result = verify(v1);
    expect(result.isValid).toBe(true);
    expect(v1.component.canonicalization).toBeDefined();
    expect(v1.otherComponent).not.toHaveProperty("canonicalization");
    expect(makeBundle(v1)).not.toHaveProperty("canonicalization");
  });

  it.each([
    [
      "unknown profile",
      { profile: "unknown", hashAlgorithm: "sha256" },
      "UNKNOWN_CANONICALIZATION_PROFILE"
    ],
    [
      "empty profile",
      { profile: "", hashAlgorithm: "sha256" },
      "MALFORMED_CANONICALIZATION_METADATA"
    ],
    [
      "unsupported algorithm",
      { profile: SHARED_CANONICALIZATION_PROFILE, hashAlgorithm: "sha512" },
      "UNSUPPORTED_HASH_ALGORITHM"
    ],
    [
      "extra metadata",
      { profile: SHARED_CANONICALIZATION_PROFILE, hashAlgorithm: "sha256", fallback: true },
      "MALFORMED_CANONICALIZATION_METADATA"
    ],
    ["null metadata", null, "MALFORMED_CANONICALIZATION_METADATA"]
  ])("fails closed for %s without profile probing", (_name, canonicalization, failure) => {
    const component = {
      ...v1.component,
      canonicalization
    } as unknown as ResearchBundle["includedArtifacts"][number];
    const result = verify(v1, component);
    expect(result.isValid).toBe(false);
    expect(result.violations.join("\n")).toContain(failure);
    expect(result.violations.join("\n")).not.toContain("legacy workspace digest mismatch");
  });

  it("rejects payload, digest, path, version, root, and non-workspace-child tampering", () => {
    const payloadTamper = new Map(makeArtifacts(v1));
    payloadTamper.set(v1.path, v1.expectedPayloadCanonicalUtf8!.replace("Café Δ", "Café X"));
    expect(verify(v1, v1.component, {}, payloadTamper).isValid).toBe(false);

    expect(verify(v1, { ...v1.component, sha256: "0".repeat(64) }).isValid).toBe(false);
    expect(
      verify(v1, { ...v1.component, path: "runs/replayed-workspace.json" }).violations.join("\n")
    ).toContain(WORKSPACE_COMPONENT_VERIFICATION_FAILURE.LEGACY_COMPONENT_NOT_ELIGIBLE);
    expect(verify(v1, v1.component, { version: "2.0.0" }).isValid).toBe(false);
    expect(verify(v1, v1.component, { merkleRootHash: "0".repeat(64) }).isValid).toBe(false);

    const childTamper = new Map(makeArtifacts(v1));
    childTamper.set(v1.otherComponent.path, '{"id":"mutated"}');
    expect(verify(v1, v1.component, {}, childTamper).isValid).toBe(false);
  });

  it("keeps root framing unchanged and changes only the workspace path:digest entry", () => {
    const legacyEntries = legacy.expectedRootInput.split("|");
    const v1Entries = v1.expectedRootInput.split("|");
    expect(legacyEntries[0]).toBe(v1Entries[0]);
    expect(legacyEntries[1]).toBe(`${WORKSPACE_SNAPSHOT_COMPONENT_PATH}:${legacy.expectedDigest}`);
    expect(v1Entries[1]).toBe(`${WORKSPACE_SNAPSHOT_COMPONENT_PATH}:${v1.expectedDigest}`);
    expect(v1.expectedRoot).not.toBe(legacy.expectedRoot);
  });

  it("is insertion-order independent and rejects values outside the V1 domain", () => {
    const reordered = Object.fromEntries(
      Object.entries(v1.payload).reverse()
    ) as unknown as WorkspaceSnapshot;
    expect(hashWorkspaceComponentV1(reordered).sha256).toBe(v1.expectedDigest);

    const invalidValues: unknown[] = [
      { ...v1.payload, activeRunsCount: 0.5 },
      { ...v1.payload, activeRunsCount: Number.MAX_SAFE_INTEGER + 1 },
      { ...v1.payload, activeRunsCount: Number.NaN },
      { ...v1.payload, activeRunsCount: Number.POSITIVE_INFINITY },
      { ...v1.payload, unsupported: undefined },
      { ...v1.payload, workspaceName: "\ud800" }
    ];
    const cyclic = { ...v1.payload } as Record<string, unknown>;
    cyclic.self = cyclic;
    invalidValues.push(cyclic);

    for (const workspaceSnapshot of invalidValues) {
      expect(() =>
        new ResearchBundleBuilder().buildBundle({
          bundleId: "bundle_invalid_workspace",
          title: "Invalid",
          author: "SemantIQ",
          workspaceSnapshot: workspaceSnapshot as WorkspaceSnapshot,
          workspaceSnapshotCanonicalization: SHARED_CANONICALIZATION_PROFILE
        })
      ).toThrow();
    }
  });

  it("keeps legacy schema instances valid and accepts only the closed optional V1 metadata", () => {
    const schemaDocument = JSON.parse(
      readFileSync(resolve(root, "schemas/product-contracts.schema.json"), "utf8")
    ) as { definitions: { ResearchBundle: object } };
    const validate = new Ajv({ strict: true, validateFormats: false }).compile(
      schemaDocument.definitions.ResearchBundle
    );
    expect(validate(makeBundle(legacy))).toBe(true);
    expect(validate(makeBundle(v1))).toBe(true);

    const extraMetadata = {
      ...v1.component,
      canonicalization: { ...v1.component.canonicalization, fallback: true }
    } as unknown as ResearchBundle["includedArtifacts"][number];
    expect(validate(makeBundle(v1, extraMetadata))).toBe(false);
  });
});
