export interface Result<TValue, TError = Error> {
  readonly ok: boolean;
  readonly value?: TValue;
  readonly error?: TError;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  readonly debug: (message: string, context?: LogContext) => void;
  readonly info: (message: string, context?: LogContext) => void;
  readonly warn: (message: string, context?: LogContext) => void;
  readonly error: (message: string, context?: LogContext) => void;
}

export type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /password|secret|token|key|credential/i;

export function redactLogContext(context: LogContext = {}): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : value
    ])
  );
}

export function createConsoleLogger(
  options: { readonly level?: LogLevel; readonly namespace?: string } = {}
): Logger {
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  const configuredLevel = options.level ?? "info";

  const write = (level: LogLevel, message: string, context?: LogContext): void => {
    if (order[level] < order[configuredLevel]) return;
    const payload = {
      level,
      namespace: options.namespace ?? "semantiq",
      message,
      context: redactLogContext(context)
    };
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context)
  };
}

export interface SerializedApplicationError {
  readonly name: string;
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: unknown;
}

export class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { readonly code: string; readonly statusCode?: number; readonly details?: unknown }
  ) {
    super(message);
    this.name = "ApplicationError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;
  }

  serialize(): SerializedApplicationError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "CONFIGURATION_ERROR", statusCode: 500, details });
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "VALIDATION_ERROR", statusCode: 400, details });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "NOT_FOUND", statusCode: 404, details });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "CONFLICT", statusCode: 409, details });
    this.name = "ConflictError";
  }
}

export class PermissionError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, { code: "PERMISSION_DENIED", statusCode: 403, details });
    this.name = "PermissionError";
  }
}

export function serializeError(error: unknown): SerializedApplicationError {
  if (error instanceof ApplicationError) return error.serialize();
  if (error instanceof Error) {
    return { name: error.name, code: "INTERNAL_ERROR", message: error.message, statusCode: 500 };
  }
  return {
    name: "UnknownError",
    code: "INTERNAL_ERROR",
    message: "Unknown error",
    statusCode: 500
  };
}

export * from "./core-primitives.js";
