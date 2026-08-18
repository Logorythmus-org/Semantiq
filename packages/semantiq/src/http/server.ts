/**
 * @package @tech-club/semantiq
 * Authoritative UI-Independent HTTP API Server
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  createSemantiqApplicationService,
  type SemantiqApplicationService
} from "../services/index.js";
import { SemantiqHttpRouter } from "./router.js";
import type { SemantiqHttpApplication, SemantiqHttpServerOptions } from "./types.js";

/**
 * Creates a standalone, UI-independent SemantIQ HTTP API server.
 * Can run with NO Web UI installed.
 */
export function createSemantiqHttpServer(
  options: SemantiqHttpServerOptions = {}
): SemantiqHttpApplication {
  const service: SemantiqApplicationService =
    options.service ?? createSemantiqApplicationService();
  const host = options.host ?? "127.0.0.1";
  const configuredPort = options.port ?? 0;
  const basePath = options.basePath ?? "/api/v1";

  const router = new SemantiqHttpRouter(
    service,
    basePath,
    options.staticDir,
    options.enableCors ?? true
  );

  const server: Server = createServer((req, res) => {
    void router.handleRequest(req, res);
  });

  let activePort = configuredPort;

  return {
    server,
    get port() {
      return activePort;
    },
    host,
    basePath,
    service,
    start: () =>
      new Promise<number>((resolve, reject) => {
        const onError = (error: Error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          const address = server.address() as AddressInfo;
          activePort = address.port;
          resolve(activePort);
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(configuredPort, host);
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close((err) => (err ? reject(err) : resolve()));
      })
  };
}
