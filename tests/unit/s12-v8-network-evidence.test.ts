import { describe, expect, it } from "vitest";
const { assessV8Evidence, FIXTURE, V8_SCHEMA } = await import(
  new URL("../../scripts/s12-v8-network-evidence.mjs", import.meta.url).href
);

const valid = () => ({
  schema: V8_SCHEMA,
  runId: "test-run",
  fixtureId: FIXTURE.id,
  fixtureVersion: FIXTURE.version,
  fixtureDigest: FIXTURE.digest,
  startingTreeDigest: FIXTURE.startingTreeDigest,
  imageReference: "pinned:local",
  imageContentDigest: "sha256:base",
  imageId: "sha256:image",
  nodeVersion: "v22.0.0",
  pnpmVersion: "11.7.0",
  containerOsArch: "linux/x64",
  executionWindowStart: "2026-01-01T00:00:00.000Z",
  executionWindowEnd: "2026-01-01T00:00:01.000Z",
  ipv4Interfaces: [],
  ipv6Interfaces: [],
  ipv4Routes: [],
  ipv6Routes: [],
  dnsConfiguration: [],
  executionWindowDefined: "YES",
  setupAndExecutionNetworkSeparated: "YES",
  pinnedImageIdentityRecorded: "YES",
  networkMode: "none",
  privileged: false,
  dockerSocketMounted: false,
  hostRuntimeSocketMounted: false,
  capNetAdmin: "ABSENT",
  capSysAdmin: "ABSENT",
  noNewPrivileges: true,
  noExternalIpv4Route: "YES",
  noExternalIpv6Route: "YES",
  processTreeContainment: "COMPLETE",
  descendantsAccounted: "YES",
  parentControlProbe: "EXPECTED_DENIAL",
  childControlProbe: "EXPECTED_DENIAL",
  parentProbeErrorClass: "ENETUNREACH",
  childProbeErrorClass: "ENETUNREACH",
  parentProbeDurationMs: 2,
  childProbeDurationMs: 2,
  externalNetworkReachability: "DENIED",
  tcpExternalReachability: "DENIED",
  udpExternalReachability: "DENIED",
  dnsExternalReachability: "DENIED",
  unexpectedPackageFetches: "NONE",
  qualificationResult: "PASS",
  d2TargetResult: "PASS",
  d2TargetDurationSeconds: 1,
  fixtureIdentityUnchanged: "YES",
  historical011Unchanged: "YES",
  trackASemanticsUnchanged: "YES",
  openRouterCalls: 0,
  scientificSemanticsUnchanged: "YES",
  scientificAuthority: "NONE",
  networkEvidenceStorageClass: "EXECUTION_CONTROL_SIDECAR"
});

describe("S12 V8 fail-closed execution control", () => {
  it("accepts a complete qualifying report", () => {
    expect(assessV8Evidence(valid())).toEqual({ status: "PASS" });
  });
  const negatives: [string, string, unknown][] = [
    ["missing sidecar field", "schema", undefined],
    ["network mode", "networkMode", "bridge"],
    ["privileged", "privileged", true],
    ["Docker socket", "dockerSocketMounted", true],
    ["host runtime socket", "hostRuntimeSocketMounted", true],
    ["CAP_NET_ADMIN", "capNetAdmin", "PRESENT"],
    ["CAP_SYS_ADMIN", "capSysAdmin", "PRESENT"],
    ["no-new-privileges", "noNewPrivileges", false],
    ["IPv4 route", "noExternalIpv4Route", "NO"],
    ["IPv6 route", "noExternalIpv6Route", "NO"],
    ["parent success", "parentControlProbe", "CONNECTED"],
    ["parent timeout", "parentControlProbe", "TIMEOUT"],
    ["child success", "childControlProbe", "CONNECTED"],
    ["child timeout", "childControlProbe", "TIMEOUT"],
    ["UDP unknown", "udpExternalReachability", "UNKNOWN"],
    ["DNS unknown", "dnsExternalReachability", "UNKNOWN"],
    ["package fetch", "unexpectedPackageFetches", "DETECTED"],
    ["descendant accounting", "descendantsAccounted", "NO"],
    ["fixture identity", "fixtureIdentityUnchanged", "NO"],
    ["qualification", "qualificationResult", "FAIL"],
    ["D2", "d2TargetResult", "FAIL"],
    ["OpenRouter", "openRouterCalls", 1]
  ];
  it.each(negatives)("rejects %s", (_name, field, value) => {
    const report = { ...valid(), [field]: value };
    expect(assessV8Evidence(report)).toEqual({ status: "NOT_ESTABLISHED", failedField: field });
  });
});
