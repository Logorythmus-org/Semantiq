/**
 * @package @semantiq/adapter-oci
 * Lightweight Docker Engine REST Client over UDS / Windows Named Pipe / TCP
 */

import * as http from "http";
import * as net from "net";

export interface DockerClientConfig {
  readonly socketPath?: string;
  readonly host?: string;
  readonly port?: number;
  readonly timeoutMs?: number;
}

export class DockerEngineHttpClient {
  private readonly socketPath: string;
  private readonly timeoutMs: number;

  constructor(config?: DockerClientConfig) {
    this.socketPath = config?.socketPath || this.detectDefaultSocket();
    this.timeoutMs = config?.timeoutMs || 30000;
  }

  private detectDefaultSocket(): string {
    if (process.env.DOCKER_HOST) return process.env.DOCKER_HOST;
    if (process.platform === "win32") return "//./pipe/docker_engine";
    return "/var/run/docker.sock";
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const isNamedPipe = this.socketPath.startsWith("//./pipe/");
      const options: http.RequestOptions = isNamedPipe
        ? { path, method, headers: { "Content-Type": "application/json" }, timeout: this.timeoutMs }
        : {
            socketPath: this.socketPath,
            path,
            method,
            headers: { "Content-Type": "application/json" },
            timeout: this.timeoutMs
          };

      const req = http.request(options, (res) => {
        let rawData = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Docker API Error (${res.statusCode}): ${rawData}`));
          }
          if (res.statusCode === 204 || !rawData) {
            return resolve({} as T);
          }
          try {
            resolve(JSON.parse(rawData) as T);
          } catch {
            resolve(rawData as unknown as T);
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Docker request timed out after ${this.timeoutMs}ms: ${path}`));
      });
      req.on("error", reject);

      if (body !== undefined) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  async openHijackedStream(path: string, body: unknown): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const isNamedPipe = this.socketPath.startsWith("//./pipe/");
      const options: http.RequestOptions = isNamedPipe
        ? {
            path,
            method: "POST",
            headers: { "Content-Type": "application/json", Upgrade: "tcp", Connection: "Upgrade" }
          }
        : {
            socketPath: this.socketPath,
            path,
            method: "POST",
            headers: { "Content-Type": "application/json", Upgrade: "tcp", Connection: "Upgrade" }
          };

      const req = http.request(options);
      req.on("upgrade", (_res, socket) => resolve(socket));
      req.on("error", reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }
}
