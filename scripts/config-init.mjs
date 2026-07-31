import { bootstrapLocalEnvironment, loadTechClubSettings } from "../packages/config/src/index.ts";

const dryRun = process.argv.includes("--dry-run");
const settings = loadTechClubSettings();
const directories = await bootstrapLocalEnvironment(settings, dryRun);
console.log(`${dryRun ? "Would prepare" : "Prepared"} ${directories.length} local directories.`);
