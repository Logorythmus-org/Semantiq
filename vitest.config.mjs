import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts", "services/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "artifacts/coverage",
      include: [
        "packages/config/src/**/*.ts",
        "packages/shared/src/**/*.ts",
        "packages/persistence/src/**/*.ts",
        "packages/questions/src/**/*.ts",
        "services/api/src/server.ts"
      ],
      exclude: ["**/*.d.ts", "**/index.ts"]
    }
  }
});
