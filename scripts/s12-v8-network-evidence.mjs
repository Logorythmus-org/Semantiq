import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces, platform, arch } from "node:os";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import dgram from "node:dgram";
import { performance } from "node:perf_hooks";

export const V8_SCHEMA = "s12.v8.execution-control/1";
export const FIXTURE = Object.freeze({
  id: "s12_lh_config_migration_feasibility",
  version: "0.1.2",
  digest: "05041288fc913ad00e66162b62665159fe6831f74f5c1e7b4bd14d269b7344c5",
  startingTreeDigest: "e68e7db0ec98100505e8efed25e507439b78effd17c12eb86ce6facb0d2304c9",
  verifierDigest: "ef2a7cea458bdc30d8fab95b4427eabef63f151b6902f12a2af82ffdd4e085ca"
});

// A closed allowlist: absence, ambiguity, or an unexpected value always fails V8.
export function assessV8Evidence(e) {
  const required = {
    schema: V8_SCHEMA,
    fixtureId: FIXTURE.id,
    fixtureVersion: FIXTURE.version,
    fixtureDigest: FIXTURE.digest,
    startingTreeDigest: FIXTURE.startingTreeDigest,
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
    externalNetworkReachability: "DENIED",
    tcpExternalReachability: "DENIED",
    udpExternalReachability: "DENIED",
    dnsExternalReachability: "DENIED",
    unexpectedPackageFetches: "NONE",
    qualificationResult: "PASS",
    d2TargetResult: "PASS",
    fixtureIdentityUnchanged: "YES",
    historical011Unchanged: "YES",
    trackASemanticsUnchanged: "YES",
    openRouterCalls: 0,
    scientificSemanticsUnchanged: "YES",
    scientificAuthority: "NONE",
    networkEvidenceStorageClass: "EXECUTION_CONTROL_SIDECAR"
  };
  for (const [key, expected] of Object.entries(required)) {
    if (e?.[key] !== expected) return { status: "NOT_ESTABLISHED", failedField: key };
  }
  for (const key of [
    "runId",
    "imageReference",
    "imageContentDigest",
    "imageId",
    "nodeVersion",
    "pnpmVersion",
    "containerOsArch",
    "executionWindowStart",
    "executionWindowEnd",
    "ipv4Interfaces",
    "ipv6Interfaces",
    "ipv4Routes",
    "ipv6Routes",
    "dnsConfiguration",
    "parentProbeErrorClass",
    "childProbeErrorClass"
  ]) {
    if (e[key] === undefined || e[key] === null || e[key] === "")
      return { status: "NOT_ESTABLISHED", failedField: key };
  }
  if (
    !(
      Number.isFinite(e.d2TargetDurationSeconds) &&
      e.d2TargetDurationSeconds < 120 &&
      e.d2TargetDurationSeconds >= 0
    )
  )
    return { status: "NOT_ESTABLISHED", failedField: "d2TargetDurationSeconds" };
  if (!(e.executionWindowStart < e.executionWindowEnd))
    return { status: "NOT_ESTABLISHED", failedField: "executionWindow" };
  for (const name of ["parent", "child"]) {
    const errorClass = e[`${name}ProbeErrorClass`];
    const duration = e[`${name}ProbeDurationMs`];
    if (!denial.has(errorClass) || !Number.isFinite(duration) || duration >= 2000 || duration < 0)
      return { status: "NOT_ESTABLISHED", failedField: `${name}ProbeErrorClass` };
  }
  if (
    !Array.isArray(e.ipv4Interfaces) ||
    !Array.isArray(e.ipv6Interfaces) ||
    !Array.isArray(e.ipv4Routes) ||
    !Array.isArray(e.ipv6Routes) ||
    !Array.isArray(e.dnsConfiguration) ||
    e.ipv4Interfaces.some((item) => item.internal !== true) ||
    e.ipv6Interfaces.some((item) => item.internal !== true) ||
    e.ipv4Routes.some(routeIsExternal4) ||
    e.ipv6Routes.some(routeIsExternal6)
  )
    return { status: "NOT_ESTABLISHED", failedField: "networkNamespace" };
  return { status: "PASS" };
}

const denial = new Set(["ENETUNREACH", "EHOSTUNREACH", "ENETDOWN", "EAFNOSUPPORT"]);

async function tcpProbe() {
  const start = performance.now();
  return await new Promise((resolve) => {
    const socket = net.connect({ host: "192.0.2.1", port: 9 });
    const timer = setTimeout(() => finish("TIMEOUT", "TIMEOUT"), 2000);
    function finish(result, errorClass) {
      clearTimeout(timer);
      socket.destroy();
      resolve({ result, errorClass, durationMs: Math.round(performance.now() - start) });
    }
    socket.once("connect", () => finish("CONNECTED", "NONE"));
    socket.once("error", (error) =>
      finish(denial.has(error.code) ? "EXPECTED_DENIAL" : "AMBIGUOUS", error.code ?? "UNKNOWN")
    );
  });
}

async function udpProbe(family, host) {
  return await new Promise((resolve) => {
    const socket = dgram.createSocket(family);
    const timer = setTimeout(() => finish("TIMEOUT", "TIMEOUT"), 2000);
    function finish(result, errorClass) {
      clearTimeout(timer);
      socket.close();
      resolve({ result, errorClass });
    }
    socket.once("error", (error) =>
      finish(denial.has(error.code) ? "EXPECTED_DENIAL" : "AMBIGUOUS", error.code ?? "UNKNOWN")
    );
    socket.send(Buffer.from([0]), 9, host, (error) => {
      if (error)
        finish(denial.has(error.code) ? "EXPECTED_DENIAL" : "AMBIGUOUS", error.code ?? "UNKNOWN");
      else finish("SEND_ACCEPTED", "NONE");
    });
  });
}

function ipv4Routes() {
  const lines = readFileSync("/proc/net/route", "utf8").trim().split("\n").slice(1);
  return lines.map((line) => {
    const parts = line.trim().split(/\s+/);
    return { interface: parts[0], destination: parts[1], gateway: parts[2], mask: parts[7] };
  });
}

function ipv6Routes() {
  return readFileSync("/proc/net/ipv6_route", "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return { destination: parts[0], prefixLength: parts[1], interface: parts.at(-1) };
    });
}

function routeIsExternal4(route) {
  return route.interface !== "lo" && route.destination !== "0100007F";
}

function routeIsExternal6(route) {
  return route.interface !== "lo" && route.destination !== "00000000000000000000000000000001";
}

function run(command, args, timeout = 120000) {
  const result = spawnSync(command, args, {
    cwd: "/workspace",
    encoding: "utf8",
    timeout,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, COREPACK_ENABLE_NETWORK: "0", pnpm_config_offline: "true" }
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.code ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

async function inside() {
  const report = {
    schema: V8_SCHEMA,
    runId: process.env.S12_V8_RUN_ID,
    fixtureId: FIXTURE.id,
    fixtureVersion: FIXTURE.version,
    fixtureDigest: FIXTURE.digest,
    startingTreeDigest: FIXTURE.startingTreeDigest,
    verifierDigest: FIXTURE.verifierDigest,
    nodeVersion: process.version,
    containerOsArch: `${platform()}/${arch()}`,
    networkEvidenceStorageClass: "EXECUTION_CONTROL_SIDECAR",
    scientificAuthority: "NONE",
    openRouterCalls: 0
  };
  try {
    const pnpm = run("corepack", ["pnpm", "--version"], 10000);
    report.pnpmVersion = pnpm.status === 0 ? pnpm.stdout.trim() : "UNKNOWN";
    const interfaces = networkInterfaces();
    report.ipv4Interfaces = Object.entries(interfaces).flatMap(([name, addresses]) =>
      addresses
        .filter((a) => a.family === "IPv4")
        .map((a) => ({ name, address: a.address, internal: a.internal }))
    );
    report.ipv6Interfaces = Object.entries(interfaces).flatMap(([name, addresses]) =>
      addresses
        .filter((a) => a.family === "IPv6")
        .map((a) => ({ name, address: a.address, internal: a.internal }))
    );
    report.ipv4Routes = ipv4Routes();
    report.ipv6Routes = ipv6Routes();
    report.dnsConfiguration = readFileSync("/etc/resolv.conf", "utf8")
      .split("\n")
      .filter((line) => /^\s*nameserver\s/.test(line));
    report.noExternalIpv4Route =
      report.ipv4Routes.some(routeIsExternal4) || report.ipv4Interfaces.some((i) => !i.internal)
        ? "NO"
        : "YES";
    report.noExternalIpv6Route =
      report.ipv6Routes.some(routeIsExternal6) || report.ipv6Interfaces.some((i) => !i.internal)
        ? "NO"
        : "YES";
    const parent = await tcpProbe();
    report.parentControlProbe = parent.result;
    report.parentProbeErrorClass = parent.errorClass;
    report.parentProbeDurationMs = parent.durationMs;
    const child = run(process.execPath, [new URL(import.meta.url).pathname, "child-probe"], 5000);
    const childResult = JSON.parse(child.stdout.trim());
    report.childControlProbe = child.status === 0 ? childResult.result : "AMBIGUOUS";
    report.childProbeErrorClass = childResult.errorClass;
    report.childProbeDurationMs = childResult.durationMs;
    const udp4 = await udpProbe("udp4", "192.0.2.1");
    const udp6 = await udpProbe("udp6", "2001:db8::1");
    report.udpProbes = { ipv4: udp4, ipv6: udp6 };
    report.tcpExternalReachability =
      parent.result === "EXPECTED_DENIAL" && childResult.result === "EXPECTED_DENIAL"
        ? "DENIED"
        : "UNKNOWN";
    report.udpExternalReachability =
      report.noExternalIpv4Route === "YES" &&
      report.noExternalIpv6Route === "YES" &&
      udp4.result === "EXPECTED_DENIAL" &&
      udp6.result === "EXPECTED_DENIAL"
        ? "DENIED"
        : "UNKNOWN";
    report.dnsExternalReachability =
      report.noExternalIpv4Route === "YES" &&
      report.noExternalIpv6Route === "YES" &&
      report.ipv4Interfaces.every((i) => i.internal) &&
      report.ipv6Interfaces.every((i) => i.internal)
        ? "DENIED"
        : "UNKNOWN";
    const fixtureCheck = run(
      "./node_modules/.bin/tsx",
      [
        "-e",
        "import {verifyS12FixtureSelection} from './packages/benchmark/src/s12-fixture-selection.ts'; console.log(JSON.stringify(verifyS12FixtureSelection('./fixtures/s12-lh-config-migration-feasibility-0.1.2',{fixtureId:'s12_lh_config_migration_feasibility',fixtureVersion:'0.1.2',fixtureDigest:'05041288fc913ad00e66162b62665159fe6831f74f5c1e7b4bd14d269b7344c5'})))"
      ],
      30000
    );
    report.fixtureIdentityRecheck =
      fixtureCheck.status === 0 ? JSON.parse(fixtureCheck.stdout.trim()) : { ok: false };
    report.fixtureIdentityUnchanged = report.fixtureIdentityRecheck.ok === true ? "YES" : "NO";
    if (
      report.noExternalIpv4Route !== "YES" ||
      report.noExternalIpv6Route !== "YES" ||
      report.tcpExternalReachability !== "DENIED" ||
      report.udpExternalReachability !== "DENIED" ||
      report.dnsExternalReachability !== "DENIED" ||
      report.fixtureIdentityUnchanged !== "YES"
    )
      throw new Error("containment preflight failed");
    report.containmentVerifiedAt = new Date().toISOString();
    process.env.S12_V8_EVENT_TIMESTAMP_PATH = "/tmp/s12-v8-event.json";
    report.targetLaunchAt = new Date().toISOString();
    const begin = performance.now();
    const target = run(
      "./node_modules/.bin/vitest",
      [
        "run",
        "tests/unit/s12-qualification-readiness.test.ts",
        "-t",
        "Case A mutates a real fixture and runs verifier, evaluator, S05, and S09"
      ],
      120000
    );
    report.d2TargetDurationSeconds = Math.round(((performance.now() - begin) / 1000) * 1000) / 1000;
    report.d2TargetResult = target.status === 0 ? "PASS" : "FAIL";
    report.qualificationResult = report.d2TargetResult;
    report.targetOutput = {
      stdout: target.stdout.slice(-12000),
      stderr: target.stderr.slice(-12000),
      signal: target.signal,
      error: target.error
    };
    report.qualificationTerminalAt = new Date().toISOString();
    const event = JSON.parse(readFileSync("/tmp/s12-v8-event.json", "utf8"));
    report.executionWindowStart = event.type === "EXECUTION_START" ? event.timestamp : undefined;
    report.executionWindowDefined =
      report.executionWindowStart &&
      report.containmentVerifiedAt <= report.executionWindowStart &&
      report.executionWindowStart <= report.qualificationTerminalAt
        ? "YES"
        : "NO";
  } catch (error) {
    report.error = String(error);
  }
  writeFileSync("/tmp/s12-v8-inside.json", JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      insideStatus: report.d2TargetResult === "PASS" ? "PASS" : "FAIL",
      reportPath: "/tmp/s12-v8-inside.json",
      error: report.error
    })
  );
  if (report.d2TargetResult !== "PASS") process.exitCode = 1;
}

function hostCommand(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", timeout: 30000 });
  if (result.status !== 0) throw new Error(`${command} ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function historicalAggregate() {
  const prefix = "fixtures/s12-lh-config-migration-feasibility/";
  const files = hostCommand("git", ["ls-files", "--", prefix])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  if (files.length !== 16) return { digest: "UNKNOWN", fileCount: files.length };
  const rows = files.map((file) => {
    const digest = createHash("sha256")
      .update(readFileSync(path.join(process.cwd(), file)))
      .digest("hex");
    return `${file.slice(prefix.length)}:${digest}`;
  });
  return {
    digest: createHash("sha256").update(rows.join("\n")).digest("hex"),
    fileCount: files.length
  };
}

function finalize(containerName, insidePath, outputPath) {
  const inside = JSON.parse(readFileSync(insidePath, "utf8"));
  const container = JSON.parse(hostCommand("docker", ["inspect", containerName]))[0];
  const image = JSON.parse(hostCommand("docker", ["image", "inspect", container.Image]))[0];
  const host = container.HostConfig;
  const historical = historicalAggregate();
  const changed = [
    ...hostCommand("git", ["diff", "--name-only"]).split(/\r?\n/),
    ...hostCommand("git", ["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/)
  ].filter(Boolean);
  const allowed = [
    /^\.changeset\/s12-versioned-fixture-refreeze\.md$/,
    /^Docs\/research\/core\/S12_OPENROUTER_FEASIBILITY_IMPLEMENTATION\.md$/,
    /^fixtures\/s12-lh-config-migration-feasibility-0\.1\.2\//,
    /^packages\/benchmark\/src\/s12-(canonical-qualification|openrouter-feasibility|qualification-runner|fixture-selection)\.ts$/,
    /^scripts\/s12-(qualification\.ts|v8-network-evidence\.(mjs|d\.mts))$/,
    /^tests\/unit\/s12-(command-diagnostic-sidecar|qualification-readiness|fixture-selection|v8-network-evidence)\.test\.ts$/
  ];
  const scopeClean =
    changed.length > 0 && changed.every((file) => allowed.some((pattern) => pattern.test(file)));
  const mounts = [...(container.Mounts ?? []), ...(host.Binds ?? [])];
  const state = container.State;
  const restricted =
    host.NetworkMode === "none" &&
    host.Privileged === false &&
    host.PidMode === "" &&
    host.IpcMode === "private" &&
    host.CapDrop?.includes("ALL") &&
    !host.CapAdd?.length &&
    host.SecurityOpt?.includes("no-new-privileges") &&
    mounts.length === 0;
  const descendantsAccounted = state.Running === false && state.Pid === 0 && state.ExitCode === 0;
  const report = {
    ...inside,
    imageReference: container.Config.Image,
    imageContentDigest: "sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c",
    imageId: container.Image,
    imageRepoDigests: image.RepoDigests ?? [],
    setupNetworkUsed: "YES",
    setupNetworkActions: [
      "pinned Node 22 base image retrieval",
      "Corepack pnpm 11.7.0 provisioning",
      "root frozen-lockfile dependency provisioning",
      "independent fixture frozen-lockfile dependency and policy-cache provisioning"
    ],
    setupAndExecutionNetworkSeparated: restricted ? "YES" : "NO",
    pinnedImageIdentityRecorded:
      image.Id === container.Image && container.Config.Image === container.Image ? "YES" : "NO",
    networkMode: host.NetworkMode,
    privileged: host.Privileged,
    capabilities: { added: host.CapAdd ?? [], dropped: host.CapDrop ?? [] },
    capNetAdmin:
      host.CapDrop?.includes("ALL") && !host.CapAdd?.includes("NET_ADMIN") ? "ABSENT" : "UNKNOWN",
    capSysAdmin:
      host.CapDrop?.includes("ALL") && !host.CapAdd?.includes("SYS_ADMIN") ? "ABSENT" : "UNKNOWN",
    noNewPrivileges: host.SecurityOpt?.includes("no-new-privileges") ?? false,
    dockerSocketMounted: mounts.some((mount) => JSON.stringify(mount).includes("docker.sock")),
    hostRuntimeSocketMounted: mounts.some((mount) =>
      /containerd\.sock|podman\.sock|cri-dockerd\.sock/.test(JSON.stringify(mount))
    ),
    processTreeContainment: restricted ? "COMPLETE" : "UNKNOWN",
    descendantsAccounted: descendantsAccounted ? "YES" : "NO",
    containerState: {
      running: state.Running,
      pid: state.Pid,
      exitCode: state.ExitCode,
      startedAt: state.StartedAt,
      finishedAt: state.FinishedAt
    },
    executionWindowEnd: state.FinishedAt,
    unexpectedPackageFetches:
      restricted &&
      inside.d2TargetResult === "PASS" &&
      !/GET https:|EAI_AGAIN|ERR_PNPM_FETCH/.test(JSON.stringify(inside.targetOutput))
        ? "NONE"
        : "NOT_ESTABLISHED",
    historical011ContentDigest: historical.digest,
    historical011LockedAggregate:
      "cded7b3e81fa28742d10f8b396ee198a372a24b6522538b1f0030d2c21e830a7",
    historical011Unchanged:
      historical.fileCount === 16 &&
      spawnSync(
        "git",
        ["diff", "--quiet", "HEAD", "--", "fixtures/s12-lh-config-migration-feasibility"],
        { cwd: process.cwd() }
      ).status === 0 &&
      hostCommand("git", [
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        "fixtures/s12-lh-config-migration-feasibility"
      ]) === ""
        ? "YES"
        : "NO",
    changedPaths: changed,
    trackASemanticsUnchanged: scopeClean ? "YES" : "NO",
    scientificSemanticsUnchanged: scopeClean ? "YES" : "NO",
    crossEnvironmentEquivalenceClaimed: false
  };
  report.executionWindowDefined =
    inside.executionWindowDefined === "YES" &&
    state.StartedAt <= inside.executionWindowStart &&
    inside.qualificationTerminalAt <= state.FinishedAt
      ? "YES"
      : "NO";
  report.externalNetworkReachability =
    report.networkMode === "none" &&
    report.tcpExternalReachability === "DENIED" &&
    report.udpExternalReachability === "DENIED" &&
    report.dnsExternalReachability === "DENIED"
      ? "DENIED"
      : "NOT_ESTABLISHED";
  const decision = assessV8Evidence(report);
  report.v8Status = decision.status;
  if (decision.failedField) report.failedField = decision.failedField;
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({ v8Status: report.v8Status, failedField: report.failedField, outputPath })
  );
  if (report.v8Status !== "PASS") process.exitCode = 1;
}

if (
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])
) {
  if (process.argv[2] === "child-probe") console.log(JSON.stringify(await tcpProbe()));
  else if (process.argv[2] === "inside") await inside();
  else if (process.argv[2] === "finalize")
    finalize(process.argv[3], process.argv[4], process.argv[5]);
}
