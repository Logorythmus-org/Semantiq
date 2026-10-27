/**
 * Local-only entrypoint for the existing headless SemantIQ application.
 * No Tech Club Question API, database, external provider, or hosted service.
 */
import { createSemantiqHttpServer } from "../packages/semantiq/src/http/index.js";

const host = process.env.SEMANTIQ_HOST ?? "127.0.0.1";
const port = Number(process.env.SEMANTIQ_PORT ?? "8080");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SEMANTIQ_PORT must be an integer from 1 to 65535");
}

const app = createSemantiqHttpServer({
  host,
  port,
  enableCors: false
});

try {
  await app.start();
  console.log(
    "SemantIQ " +
      app.basePath +
      " listening at " +
      app.host +
      ":" +
      app.port +
      " (Public Alpha; local evaluation only)"
  );
} catch (error) {
  console.error("SemantIQ local HTTP startup failed:", error);
  process.exitCode = 1;
}

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  void app.stop().catch((error: unknown) => {
    console.error("SemantIQ local HTTP shutdown failed:", error);
    process.exitCode = 1;
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
