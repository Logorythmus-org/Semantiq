import { isAbsolute } from "node:path";
import { SemanticCoreQualificationError } from "./semantic-core-qualification-types.js";

/** Explicit protocol and live gates; unknown/duplicate arguments never reach a transport. */
export function parseSemanticCoreLocalArguments(raw: string[]) {
  const args = raw.filter((arg) => arg !== "--");
  const allowed = new Set([
    "--mode",
    "--protocol",
    "--authorize-live",
    "--run",
    "--condition",
    "--collection",
    "--validation"
  ]);
  const values = new Map<string, string>();
  const fail = (): never => {
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  };
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (!allowed.has(key) || values.has(key)) fail();
    if (key === "--authorize-live") values.set(key, "true");
    else {
      const value = args[++i];
      if (!value || value.startsWith("--")) fail();
      values.set(key, value!);
    }
  }
  const mode = values.get("--mode");
  if (
    values.get("--protocol") !== "0.1.3" ||
    !["live", "verify"].includes(mode ?? "") ||
    !/^[123]$/.test(values.get("--run") ?? "")
  )
    fail();
  const authorizeLive = values.has("--authorize-live");
  if ((mode === "live") !== authorizeLive) fail();
  for (const key of ["--condition", "--collection", "--validation"])
    if (!values.get(key) || !isAbsolute(values.get(key)!)) fail();
  return {
    mode: mode as "live" | "verify",
    authorizeLive,
    run: Number(values.get("--run")),
    conditionFile: values.get("--condition")!,
    collection: values.get("--collection")!,
    validationFile: values.get("--validation")!
  };
}
