import { diagnoseSettings, loadTechClubSettings } from "../packages/config/src/index.ts";

const settings = loadTechClubSettings();
const diagnostic = diagnoseSettings(settings);
if (process.argv.includes("--json")) console.log(JSON.stringify(diagnostic));
else {
  console.log(`profile: ${diagnostic.profile}`);
  console.log(`data_root: ${diagnostic.publicValues.dataRoot}`);
  console.log(`database: ${diagnostic.publicValues.database}`);
  console.log(`local_ai: ${diagnostic.publicValues.aiProvider}`);
  console.log(`warnings: ${diagnostic.warnings.length}`);
  for (const warning of diagnostic.warnings) console.warn(`WARNING ${warning}`);
}
if (diagnostic.errors.length > 0) process.exit(1);
