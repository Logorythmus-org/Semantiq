import fs from "node:fs";
import path from "node:path";

export function validateProductBoundary(cwd = process.cwd()) {
  const manifestPath = path.join(cwd, "products", "semantiq", "extraction-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return {
      valid: false,
      errors: ["Extraction manifest products/semantiq/extraction-manifest.json does not exist."]
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const errors = [];

  // Verify included paths exist
  for (const relPath of manifest.includedPaths || []) {
    const fullPath = path.join(cwd, relPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Declared included path missing: ${relPath}`);
    }
  }

  // Verify forbidden imports do not exist in packages/semantiq/src
  const srcDir = path.join(cwd, "packages", "semantiq", "src");
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
        for (const forbidden of manifest.forbiddenImports || []) {
          if (content.includes(forbidden)) {
            errors.push(`Forbidden import '${forbidden}' detected in file: ${file}`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

if (process.argv[1] && process.argv[1].endsWith("boundary-validator.mjs")) {
  const result = validateProductBoundary();
  if (!result.valid) {
    console.error("[BOUNDARY VALIDATION FAILED]:");
    result.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }
  console.log("[BOUNDARY VALIDATION PASSED]: SemantIQ product boundary is clean.");
}
