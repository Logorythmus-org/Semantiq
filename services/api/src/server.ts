import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { loadTechClubSettings, type TechClubSettings } from "../../../packages/config/src/index.js";
import {
  isQuestionRelationType,
  QuestionRuntimeError,
  type QuestionApplication,
  type QuestionDiscoveryApplication,
  type QuestionDiscoverySort,
  type QuestionDiscoveryStatus,
  type QuestionRelationApplication,
  type QuestionRelationDirection,
  type QuestionRelationType,
  type QuestionUncertaintyLevel,
  type QuestionSemanticApplication,
  type QuestionSemanticStructureInput,
  type QuestionSafetyApplication,
  type LocalFixedWindowQuestionRateLimiter,
  type QuestionSourceReferenceType,
  type QuestionReportReason,
  type QuestionModerationActionType,
  type SearchQuestionsQuery
} from "../../../packages/questions/src/index.js";

export interface ApiHealthComponent {
  readonly status: "healthy" | "degraded" | "unhealthy" | "not_checked";
  readonly message: string;
}
export interface ApiServerOptions {
  readonly settings?: TechClubSettings;
  readonly databaseHealth?: () => Promise<ApiHealthComponent>;
  readonly listenPort?: number;
  readonly questionApplication?: QuestionApplication;
  readonly questionDiscoveryApplication?: QuestionDiscoveryApplication;
  readonly questionRelationApplication?: QuestionRelationApplication;
  readonly questionSemanticApplication?: QuestionSemanticApplication;
  readonly questionSafetyApplication?: QuestionSafetyApplication;
  readonly questionRateLimiter?: LocalFixedWindowQuestionRateLimiter;
}
export interface ApiApplication {
  readonly server: Server;
  readonly settings: TechClubSettings;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createApiApplication(options: ApiServerOptions = {}): ApiApplication {
  const settings = options.settings ?? loadTechClubSettings();
  const server = createServer((request, response) => {
    void handleRequest(
      request,
      response,
      settings,
      options.databaseHealth,
      options.questionApplication,
      options.questionDiscoveryApplication,
      options.questionRelationApplication,
      options.questionSemanticApplication,
      options.questionSafetyApplication,
      options.questionRateLimiter
    );
  });
  return {
    server,
    settings,
    start: () =>
      new Promise((resolve, reject) => {
        const onError = (error: Error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(options.listenPort ?? settings.application.port, settings.application.host);
      }),
    stop: () =>
      new Promise((resolve, reject) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  settings: TechClubSettings,
  databaseHealth?: () => Promise<ApiHealthComponent>,
  questionApplication?: QuestionApplication,
  questionDiscoveryApplication?: QuestionDiscoveryApplication,
  questionRelationApplication?: QuestionRelationApplication,
  questionSemanticApplication?: QuestionSemanticApplication,
  questionSafetyApplication?: QuestionSafetyApplication,
  questionRateLimiter?: LocalFixedWindowQuestionRateLimiter
): Promise<void> {
  const correlationId = request.headers["x-correlation-id"] ?? randomUUID();
  if (Array.isArray(correlationId) || !/^[A-Za-z0-9._:-]{1,128}$/.test(correlationId)) {
    send(
      response,
      400,
      { error: { code: "INVALID_CORRELATION_ID", message: "Invalid correlation ID" } },
      "invalid"
    );
    return;
  }
  response.setHeader("x-correlation-id", correlationId);
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = url.pathname;
    if (
      questionApplication &&
      (pathname === "/questions" ||
        pathname === `${settings.application.basePath}/questions` ||
        pathname === "/api/v1/questions" ||
        pathname.startsWith("/questions/") ||
        pathname.startsWith(`${settings.application.basePath}/questions/`) ||
        pathname.startsWith("/api/v1/questions/"))
    ) {
      await handleQuestionRoute(
        request,
        response,
        pathname,
        url.searchParams,
        correlationId,
        questionApplication,
        questionDiscoveryApplication,
        questionRelationApplication,
        questionSemanticApplication,
        questionSafetyApplication,
        questionRateLimiter
      );
      return;
    }
    if (request.method !== "GET") {
      send(
        response,
        405,
        { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", correlationId } },
        correlationId
      );
      return;
    }
    if (pathname === "/health" || pathname === `${settings.application.basePath}/health`) {
      const database = databaseHealth
        ? await databaseHealth()
        : ({
            status: "not_checked",
            message: "Database check not configured"
          } satisfies ApiHealthComponent);
      const overall = database.status === "unhealthy" ? "degraded" : "healthy";
      send(
        response,
        200,
        {
          data: {
            status: overall,
            components: { api: { status: "healthy", message: "API process is alive" }, database }
          },
          meta: { correlationId, version: "1.0" }
        },
        correlationId
      );
      return;
    }
    if (pathname === "/ready" || pathname === `${settings.application.basePath}/ready`) {
      const database = databaseHealth
        ? await databaseHealth()
        : ({
            status: "not_checked",
            message: "Database check not configured"
          } satisfies ApiHealthComponent);
      const ready = database.status !== "unhealthy";
      send(
        response,
        ready ? 200 : 503,
        {
          data: {
            status: ready ? "ready" : "not_ready",
            components: { api: { status: "healthy", message: "API process is ready" }, database }
          },
          meta: { correlationId, version: "1.0" }
        },
        correlationId
      );
      return;
    }
    send(
      response,
      404,
      { error: { code: "NOT_FOUND", message: "Route not found", correlationId } },
      correlationId
    );
  } catch {
    send(
      response,
      500,
      { error: { code: "INTERNAL_ERROR", message: "Internal server error", correlationId } },
      correlationId
    );
  }
}

async function handleQuestionRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  searchParams: URLSearchParams,
  correlationId: string,
  application: QuestionApplication,
  discoveryApplication?: QuestionDiscoveryApplication,
  relationApplication?: QuestionRelationApplication,
  semanticApplication?: QuestionSemanticApplication,
  safetyApplication?: QuestionSafetyApplication,
  rateLimiter?: LocalFixedWindowQuestionRateLimiter
): Promise<void> {
  const segments = pathname.split("/").filter(Boolean);
  const questionIndex = segments.indexOf("questions");
  const route = questionIndex >= 0 ? segments.slice(questionIndex + 1) : [];
  const questionId = route[0];
  const action = route[1];
  const actorId = header(request, "x-actor-id") ?? "";
  const idempotencyKey = header(request, "idempotency-key");
  const causationId = header(request, "x-causation-id");

  if (rateLimiter) {
    const operation = rateLimitOperation(request.method ?? "GET", route);
    const decision = rateLimiter.consume(
      operation,
      actorId || header(request, "x-client-id") || request.socket.remoteAddress || "anonymous"
    );
    if (!decision.allowed) {
      response.setHeader("retry-after", String(decision.retryAfterSeconds));
      send(
        response,
        429,
        {
          error: {
            code: "rate_limit_exceeded",
            message: "Question runtime rate limit exceeded",
            details: { operation, retryAfterSeconds: decision.retryAfterSeconds },
            correlationId
          }
        },
        correlationId
      );
      return;
    }
  }

  if (safetyApplication) {
    const handled = await handleQuestionSafetyRoute({
      request,
      response,
      route,
      ...(questionId ? { questionId } : {}),
      actorId,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      ...(causationId ? { causationId } : {}),
      correlationId,
      application: safetyApplication
    });
    if (handled) return;
  }

  if (request.method === "GET" && route.length === 0) {
    if (!discoveryApplication) {
      sendDiscoveryRuntimeNotConfigured(response, correlationId);
      return;
    }
    let query: SearchQuestionsQuery;
    try {
      query = discoveryQueryOptions(searchParams, correlationId);
    } catch (error) {
      sendResultError(
        response,
        error instanceof QuestionRuntimeError
          ? {
              code: error.code,
              message: error.message,
              category: error.category,
              ...(error.details === undefined ? {} : { details: error.details })
            }
          : {
              code: "question_query_invalid",
              message: "Question discovery query is invalid",
              category: "validation"
            },
        correlationId
      );
      return;
    }
    const startedAt = performance.now();
    const result =
      query.textQuery === undefined
        ? await discoveryApplication.list(query)
        : await discoveryApplication.search(query);
    logQuestionDiscovery({
      operation: query.textQuery === undefined ? "list" : "search",
      queryPresent: result.metadata?.queryPresent ?? query.textQuery !== undefined,
      normalizedQueryLength: result.metadata?.normalizedQueryLength ?? 0,
      filterNames: result.metadata?.filterNames ?? [],
      resultCount: result.ok ? result.value.items.length : 0,
      limit: result.ok ? result.value.page.limit : (query.limit ?? 20),
      result: result.ok ? "success" : result.error.code,
      correlationId,
      durationMs: Number((performance.now() - startedAt).toFixed(3))
    });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (request.method === "POST" && route.length === 0) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return;
    const result = await application.create({
      text: typeof body.text === "string" ? body.text : "",
      language: typeof body.language === "string" ? body.language : "",
      ...(actorId ? { creatorId: actorId } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
    if (result.ok) {
      send(
        response,
        201,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (request.method === "DELETE" && questionId && action === "relations" && route.length === 3) {
    if (!relationApplication) {
      sendRuntimeNotConfigured(response, correlationId);
      return;
    }
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return;
    const expectedVersion = body.expectedVersion ?? body.expected_version;
    const result = await relationApplication.remove({
      relationId: route[2] ?? "",
      expectedVersion: typeof expectedVersion === "number" ? expectedVersion : Number.NaN,
      actorId,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (questionId && action === "relations" && route.length === 2) {
    if (!relationApplication) {
      sendRuntimeNotConfigured(response, correlationId);
      return;
    }
    if (request.method === "POST") {
      const body = await readQuestionBody(request, response, correlationId);
      if (!body) return;
      const targetQuestionId = body.targetQuestionId ?? body.target_question_id;
      const startedAt = performance.now();
      const result = await relationApplication.create({
        sourceQuestionId: questionId,
        targetQuestionId: typeof targetQuestionId === "string" ? targetQuestionId : "",
        type:
          typeof body.type === "string"
            ? (body.type as QuestionRelationType)
            : ("" as QuestionRelationType),
        actorId,
        ...(idempotencyKey ? { idempotencyKey } : {}),
        correlationId,
        ...(causationId ? { causationId } : {})
      });
      logQuestionRelation({
        operation: "create",
        sourceQuestionId: safeLogIdentifier(questionId),
        targetQuestionId:
          typeof targetQuestionId === "string" ? safeLogIdentifier(targetQuestionId) : "invalid",
        relationType: isQuestionRelationType(body.type) ? body.type : "invalid",
        actorId: safeLogActor(actorId),
        result: result.ok ? "success" : result.error.code,
        correlationId,
        durationMs: Number((performance.now() - startedAt).toFixed(3))
      });
      if (result.ok) {
        send(
          response,
          201,
          { data: result.value, meta: { correlationId, version: "v1" } },
          correlationId
        );
        return;
      }
      sendResultError(response, result.error, correlationId);
      return;
    }
    if (request.method === "GET") {
      const result = await relationApplication.list({
        questionId,
        ...relationQueryOptions(searchParams),
        correlationId
      });
      if (result.ok) {
        send(
          response,
          200,
          { data: result.value, meta: { correlationId, version: "v1" } },
          correlationId
        );
        return;
      }
      sendResultError(response, result.error, correlationId);
      return;
    }
  }

  if (request.method === "GET" && questionId && action === "graph" && route.length === 2) {
    if (!relationApplication) {
      sendRuntimeNotConfigured(response, correlationId);
      return;
    }
    if (safetyApplication && !(await safetyApplication.canReadQuestion(questionId, actorId))) {
      sendHidden(response, correlationId);
      return;
    }
    const result = await relationApplication.graph({
      questionId,
      ...graphQueryOptions(searchParams),
      correlationId
    });
    if (result.ok) {
      let graph = result.value;
      if (safetyApplication) {
        const visible = new Set<string>();
        for (const node of graph.nodes)
          if (await safetyApplication.canReadQuestion(node.id, actorId)) visible.add(node.id);
        graph = {
          ...graph,
          nodes: graph.nodes.filter((node) => visible.has(node.id)),
          relations: graph.relations.filter(
            (relation) =>
              visible.has(relation.sourceQuestionId) && visible.has(relation.targetQuestionId)
          )
        };
      }
      send(response, 200, { data: graph, meta: { correlationId, version: "v1" } }, correlationId);
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (questionId && action === "semantic-structure" && route.length === 2) {
    if (!semanticApplication) {
      sendSemanticRuntimeNotConfigured(response, correlationId);
      return;
    }
    if (request.method === "PUT") {
      const body = await readQuestionBody(request, response, correlationId);
      if (!body) return;
      const expectedVersion = body.expectedVersion ?? body.expected_version;
      const startedAt = performance.now();
      const result = await semanticApplication.put({
        questionId,
        expectedVersion: typeof expectedVersion === "number" ? expectedVersion : Number.NaN,
        structure: semanticStructureFromBody(body),
        actorId,
        ...(typeof body.reason === "string" ? { reason: body.reason } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
        correlationId,
        ...(causationId ? { causationId } : {})
      });
      logQuestionSemanticStructure({
        operation: "put",
        questionId: safeLogIdentifier(questionId),
        actorId: safeLogActor(actorId),
        expectedVersion:
          typeof expectedVersion === "number" && Number.isInteger(expectedVersion)
            ? expectedVersion
            : "invalid",
        ...(result.ok
          ? { newVersion: result.value.version, result: "success" }
          : { result: result.error.code }),
        correlationId,
        durationMs: Number((performance.now() - startedAt).toFixed(3))
      });
      if (result.ok) {
        send(
          response,
          expectedVersion === 0 ? 201 : 200,
          { data: result.value, meta: { correlationId, version: "v1" } },
          correlationId
        );
        return;
      }
      sendResultError(response, result.error, correlationId);
      return;
    }
    if (request.method === "GET") {
      if (safetyApplication && !(await safetyApplication.canReadQuestion(questionId, actorId))) {
        sendHidden(response, correlationId);
        return;
      }
      const result = await semanticApplication.get({ questionId, correlationId });
      if (result.ok) {
        send(
          response,
          200,
          { data: result.value, meta: { correlationId, version: "v1" } },
          correlationId
        );
        return;
      }
      sendResultError(response, result.error, correlationId);
      return;
    }
  }

  if (
    request.method === "GET" &&
    questionId &&
    action === "semantic-snapshot" &&
    route.length === 2
  ) {
    if (!semanticApplication) {
      sendSemanticRuntimeNotConfigured(response, correlationId);
      return;
    }
    if (safetyApplication && !(await safetyApplication.canReadQuestion(questionId, actorId))) {
      sendHidden(response, correlationId);
      return;
    }
    const result = await semanticApplication.snapshot({ questionId, correlationId });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (
    request.method === "GET" &&
    questionId &&
    action === "semantic-structure" &&
    route[2] === "revisions" &&
    route.length === 3
  ) {
    if (!semanticApplication) {
      sendSemanticRuntimeNotConfigured(response, correlationId);
      return;
    }
    const result = await semanticApplication.revisions({ questionId, actorId, correlationId });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (request.method === "GET" && questionId && action === "detail" && route.length === 2) {
    if (!discoveryApplication) {
      sendDiscoveryRuntimeNotConfigured(response, correlationId);
      return;
    }
    if (safetyApplication && !(await safetyApplication.canReadQuestion(questionId, actorId))) {
      sendHidden(response, correlationId);
      return;
    }
    const result = await discoveryApplication.getDetail({ questionId, correlationId });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (request.method === "GET" && questionId && route.length === 1) {
    if (safetyApplication && !(await safetyApplication.canReadQuestion(questionId, actorId))) {
      sendHidden(response, correlationId);
      return;
    }
    const result = await application.get({ questionId, correlationId });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (request.method === "GET" && questionId && action === "revisions" && route.length === 2) {
    const result = await application.revisions({ questionId, actorId, correlationId });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  if (
    questionId &&
    ((request.method === "PATCH" && route.length === 1) ||
      (request.method === "POST" &&
        route.length === 2 &&
        (action === "archive" || action === "restore")))
  ) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return;
    const expectedVersion = body.expectedVersion ?? body.expected_version;
    const common = {
      questionId,
      expectedVersion: typeof expectedVersion === "number" ? expectedVersion : Number.NaN,
      actorId,
      ...(typeof body.reason === "string" ? { reason: body.reason } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    };
    const operation = request.method === "PATCH" ? "update" : action!;
    const startedAt = performance.now();
    const result =
      operation === "update"
        ? await application.update({
            ...common,
            text: typeof body.text === "string" ? body.text : ""
          })
        : operation === "archive"
          ? await application.archive(common)
          : await application.restore(common);
    logQuestionMutation({
      operation,
      questionId,
      actorId: safeLogActor(actorId),
      previousVersion: common.expectedVersion,
      ...(result.ok
        ? { newVersion: result.value.version, status: result.value.status, result: "success" }
        : { result: result.error.code }),
      correlationId,
      durationMs: Number((performance.now() - startedAt).toFixed(3))
    });
    if (result.ok) {
      send(
        response,
        200,
        { data: result.value, meta: { correlationId, version: "v1" } },
        correlationId
      );
      return;
    }
    sendResultError(response, result.error, correlationId);
    return;
  }

  send(
    response,
    route.length <= 2 ? 405 : 404,
    {
      error: {
        code: route.length <= 2 ? "METHOD_NOT_ALLOWED" : "NOT_FOUND",
        message: route.length <= 2 ? "Method not allowed" : "Route not found",
        correlationId
      }
    },
    correlationId
  );
}

async function handleQuestionSafetyRoute(input: {
  request: IncomingMessage;
  response: ServerResponse;
  route: readonly string[];
  questionId?: string;
  actorId: string;
  idempotencyKey?: string;
  causationId?: string;
  correlationId: string;
  application: QuestionSafetyApplication;
}): Promise<boolean> {
  const {
    request,
    response,
    route,
    questionId,
    actorId,
    idempotencyKey,
    causationId,
    correlationId,
    application
  } = input;
  if (!questionId) return false;
  const resource = route[1];
  let result;
  if (resource === "sources" && request.method === "GET" && route.length === 2) {
    result = await application.listSources({ questionId, actorId, includeRemoved: false });
  } else if (resource === "sources" && request.method === "GET" && route.length === 3) {
    result = await application.getSource({ referenceId: route[2]!, actorId });
  } else if (resource === "sources" && request.method === "POST" && route.length === 2) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.addSource({
      questionId,
      sourceType: body.sourceType as QuestionSourceReferenceType,
      title: typeof body.title === "string" ? body.title : "",
      locator: typeof body.locator === "string" ? body.locator : "",
      ...(typeof body.description === "string" ? { description: body.description } : {}),
      actorId,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (
    resource === "sources" &&
    request.method === "POST" &&
    route[3] === "remove" &&
    route.length === 4
  ) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.removeSource({
      referenceId: route[2]!,
      expectedVersion: numberBody(body, "expectedVersion", "expected_version"),
      actorId,
      reason: typeof body.reason === "string" ? body.reason : "",
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (resource === "reports" && request.method === "POST" && route.length === 2) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.submitReport({
      questionId,
      reporterId: actorId,
      reasonCode: (body.reasonCode ?? body.reason_code) as QuestionReportReason,
      description: typeof body.description === "string" ? body.description : "",
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (resource === "reports" && request.method === "GET" && route.length === 2) {
    result = await application.listReports({ questionId, actorId });
  } else if (
    resource === "reports" &&
    request.method === "POST" &&
    route[3] === "withdraw" &&
    route.length === 4
  ) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.withdrawReport({
      reportId: route[2]!,
      expectedVersion: numberBody(body, "expectedVersion", "expected_version"),
      reporterId: actorId,
      ...(typeof body.reason === "string" ? { reason: body.reason } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (resource === "moderation-cases" && request.method === "POST" && route.length === 2) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.openCase({
      questionId,
      reportIds: Array.isArray(body.reportIds ?? body.report_ids)
        ? ((body.reportIds ?? body.report_ids) as string[])
        : [],
      actorId,
      reason: typeof body.reason === "string" ? body.reason : "",
      ...(typeof body.assignedTo === "string" ? { assignedTo: body.assignedTo } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (
    resource === "moderation-cases" &&
    request.method === "POST" &&
    route[3] === "actions" &&
    route.length === 4
  ) {
    const body = await readQuestionBody(request, response, correlationId);
    if (!body) return true;
    result = await application.applyAction({
      caseId: route[2]!,
      actionType: (body.actionType ?? body.action_type) as QuestionModerationActionType,
      expectedVersion: numberBody(body, "expectedVersion", "expected_version"),
      actorId,
      reason: typeof body.reason === "string" ? body.reason : "",
      ...(idempotencyKey ? { idempotencyKey } : {}),
      correlationId,
      ...(causationId ? { causationId } : {})
    });
  } else if (resource === "audit" && request.method === "GET" && route.length === 2) {
    const parameters = new URL(request.url ?? "/", "http://localhost").searchParams;
    const limit = numberFromQuery(parameters, "limit");
    const offset = numberFromQuery(parameters, "offset");
    result = await application.listAudit({
      questionId,
      actorId,
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset })
    });
  } else if (resource === "trust-signals" && request.method === "GET" && route.length === 2) {
    result = await application.trustSignals({ questionId, actorId });
  } else return false;
  if (result.ok)
    send(
      response,
      request.method === "POST" && route.length === 2 ? 201 : 200,
      { data: result.value, meta: { correlationId, version: "v1" } },
      correlationId
    );
  else sendResultError(response, result.error, correlationId);
  return true;
}

function numberBody(body: Readonly<Record<string, unknown>>, name: string, alias: string): number {
  const value = body[name] ?? body[alias];
  return typeof value === "number" ? value : Number.NaN;
}

function rateLimitOperation(method: string, route: readonly string[]): string {
  if (route[1] === "reports") return "report";
  if (route[1] === "sources") return "source";
  if (route[1] === "relations" || route[1] === "graph")
    return route[1] === "graph" ? "graph" : "relation";
  if (route[1] === "semantic-structure") return "semantic";
  if (route[1] === "semantic-snapshot") return "semantic";
  if (route[1] === "moderation-cases") return "moderation";
  if (route.length === 0 || method === "GET") return "search";
  return method === "PATCH" || route[1] === "archive" || route[1] === "restore"
    ? "update"
    : "create";
}

function sendHidden(response: ServerResponse, correlationId: string): void {
  send(
    response,
    404,
    { error: { code: "question_not_found", message: "Question not found", correlationId } },
    correlationId
  );
}

async function readQuestionBody(
  request: IncomingMessage,
  response: ServerResponse,
  correlationId: string
): Promise<Record<string, unknown> | undefined> {
  try {
    return await readJson(request);
  } catch {
    send(
      response,
      422,
      { error: { code: "INVALID_JSON", message: "Invalid JSON body", correlationId } },
      correlationId
    );
    return undefined;
  }
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (body.length > 65536) throw new Error("request too large");
  }
  if (!body) return {};
  const parsed: unknown = JSON.parse(body);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("request body must be an object");
  return parsed as Record<string, unknown>;
}

function semanticStructureFromBody(
  body: Readonly<Record<string, unknown>>
): QuestionSemanticStructureInput {
  return {
    context: body.context,
    assumptions: body.assumptions,
    constraints: body.constraints,
    unknowns: body.unknowns,
    uncertainty: body.uncertainty,
    scope: body.scope,
    perspectives: body.perspectives,
    openPossibilities: body.openPossibilities ?? body.open_possibilities
  } as QuestionSemanticStructureInput;
}

function relationQueryOptions(searchParams: URLSearchParams): {
  readonly direction?: QuestionRelationDirection;
  readonly relationTypes?: readonly QuestionRelationType[];
  readonly page?: number;
  readonly limit?: number;
} {
  const direction = searchParams.get("direction");
  const relationTypes = relationTypesFromQuery(searchParams);
  const page = numberFromQuery(searchParams, "page");
  const limit = numberFromQuery(searchParams, "limit");
  return {
    ...(direction ? { direction: direction as QuestionRelationDirection } : {}),
    ...(relationTypes ? { relationTypes } : {}),
    ...(page === undefined ? {} : { page }),
    ...(limit === undefined ? {} : { limit })
  };
}

function graphQueryOptions(searchParams: URLSearchParams): {
  readonly direction?: QuestionRelationDirection;
  readonly relationTypes?: readonly QuestionRelationType[];
  readonly depth?: number;
  readonly maxNodes?: number;
} {
  const direction = searchParams.get("direction");
  const relationTypes = relationTypesFromQuery(searchParams);
  const depth = numberFromQuery(searchParams, "depth");
  const maxNodes = numberFromQuery(searchParams, "maxNodes", "max_nodes");
  return {
    ...(direction ? { direction: direction as QuestionRelationDirection } : {}),
    ...(relationTypes ? { relationTypes } : {}),
    ...(depth === undefined ? {} : { depth }),
    ...(maxNodes === undefined ? {} : { maxNodes })
  };
}

const QUESTION_DISCOVERY_QUERY_PARAMETERS = new Set([
  "q",
  "status",
  "creator_id",
  "created_after",
  "created_before",
  "updated_after",
  "updated_before",
  "language",
  "has_frame",
  "frame_stale",
  "has_assumptions",
  "has_unknowns",
  "uncertainty_type",
  "constraint_type",
  "relation_type",
  "relation_direction",
  "related_to_question_id",
  "sort",
  "cursor",
  "limit"
]);

function discoveryQueryOptions(
  searchParams: URLSearchParams,
  correlationId: string
): SearchQuestionsQuery {
  for (const name of new Set(searchParams.keys())) {
    if (!QUESTION_DISCOVERY_QUERY_PARAMETERS.has(name))
      throw new QuestionRuntimeError(
        "question_query_invalid",
        `Unsupported Question discovery parameter: ${name}`,
        "validation"
      );
    if (searchParams.getAll(name).length !== 1)
      throw new QuestionRuntimeError(
        "question_query_invalid",
        `Question discovery parameter must not be repeated: ${name}`,
        "validation"
      );
  }
  const status = optionalQuery(searchParams, "status");
  const sort = optionalQuery(searchParams, "sort");
  const relationType = optionalQuery(searchParams, "relation_type");
  const relationDirection = optionalQuery(searchParams, "relation_direction");
  const uncertaintyType = optionalQuery(searchParams, "uncertainty_type");
  const limit = optionalNumberQuery(searchParams, "limit");
  return {
    correlationId,
    ...(searchParams.has("q") ? { textQuery: searchParams.get("q") ?? "" } : {}),
    ...(status === undefined ? {} : { status: status as QuestionDiscoveryStatus }),
    ...optionalStringProperty(searchParams, "creator_id", "creatorId"),
    ...optionalStringProperty(searchParams, "created_after", "createdAfter"),
    ...optionalStringProperty(searchParams, "created_before", "createdBefore"),
    ...optionalStringProperty(searchParams, "updated_after", "updatedAfter"),
    ...optionalStringProperty(searchParams, "updated_before", "updatedBefore"),
    ...optionalStringProperty(searchParams, "language", "language"),
    ...optionalBooleanProperty(searchParams, "has_frame", "hasFrame"),
    ...optionalBooleanProperty(searchParams, "frame_stale", "frameStale"),
    ...optionalBooleanProperty(searchParams, "has_assumptions", "hasAssumptions"),
    ...optionalBooleanProperty(searchParams, "has_unknowns", "hasUnknowns"),
    ...(uncertaintyType === undefined
      ? {}
      : { uncertaintyType: uncertaintyType as QuestionUncertaintyLevel }),
    ...optionalStringProperty(searchParams, "constraint_type", "constraintType"),
    ...(relationType === undefined ? {} : { relationType: relationType as QuestionRelationType }),
    ...(relationDirection === undefined
      ? {}
      : { relationDirection: relationDirection as QuestionRelationDirection }),
    ...optionalStringProperty(searchParams, "related_to_question_id", "relatedToQuestionId"),
    ...(sort === undefined ? {} : { sort: sort as QuestionDiscoverySort }),
    ...optionalStringProperty(searchParams, "cursor", "cursor"),
    ...(limit === undefined ? {} : { limit })
  };
}

function optionalQuery(searchParams: URLSearchParams, name: string): string | undefined {
  const value = searchParams.get(name);
  return value === null ? undefined : value;
}

function optionalNumberQuery(searchParams: URLSearchParams, name: string): number | undefined {
  const value = optionalQuery(searchParams, name);
  return value === undefined ? undefined : Number(value);
}

function optionalStringProperty(
  searchParams: URLSearchParams,
  name: string,
  property: string
): Readonly<Record<string, string>> {
  const value = optionalQuery(searchParams, name);
  return value === undefined ? {} : { [property]: value };
}

function optionalBooleanProperty(
  searchParams: URLSearchParams,
  name: string,
  property: string
): Readonly<Record<string, boolean>> {
  const value = optionalQuery(searchParams, name);
  if (value === undefined) return {};
  if (value !== "true" && value !== "false")
    throw new QuestionRuntimeError(
      "question_filter_invalid",
      `${name} must be true or false`,
      "validation"
    );
  return { [property]: value === "true" };
}

function relationTypesFromQuery(
  searchParams: URLSearchParams
): readonly QuestionRelationType[] | undefined {
  const values = [...searchParams.getAll("type"), ...(searchParams.get("types")?.split(",") ?? [])];
  return values.length > 0
    ? values.map((value) => value.trim() as QuestionRelationType)
    : undefined;
}

function numberFromQuery(
  searchParams: URLSearchParams,
  name: string,
  alias?: string
): number | undefined {
  const value = searchParams.get(name) ?? (alias ? searchParams.get(alias) : null);
  return value === null ? undefined : Number(value);
}

function sendRuntimeNotConfigured(response: ServerResponse, correlationId: string): void {
  send(
    response,
    503,
    {
      error: {
        code: "QUESTION_RELATION_RUNTIME_NOT_CONFIGURED",
        message: "Question relation runtime is not configured",
        correlationId
      }
    },
    correlationId
  );
}

function sendSemanticRuntimeNotConfigured(response: ServerResponse, correlationId: string): void {
  send(
    response,
    503,
    {
      error: {
        code: "QUESTION_SEMANTIC_RUNTIME_NOT_CONFIGURED",
        message: "Question semantic runtime is not configured",
        correlationId
      }
    },
    correlationId
  );
}

function sendDiscoveryRuntimeNotConfigured(response: ServerResponse, correlationId: string): void {
  send(
    response,
    503,
    {
      error: {
        code: "QUESTION_DISCOVERY_RUNTIME_NOT_CONFIGURED",
        message: "Question discovery runtime is not configured",
        correlationId
      }
    },
    correlationId
  );
}

function sendResultError(
  response: ServerResponse,
  error: {
    readonly code: string;
    readonly message: string;
    readonly category: string;
    readonly details?: unknown;
  },
  correlationId: string
): void {
  const status =
    error.category === "validation"
      ? 422
      : error.category === "not_found"
        ? 404
        : error.category === "forbidden"
          ? 403
          : error.category === "unauthorized"
            ? 401
            : error.category === "conflict" || error.category === "domain"
              ? 409
              : 503;
  send(
    response,
    status,
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
        correlationId
      }
    },
    correlationId
  );
}

function send(
  response: ServerResponse,
  status: number,
  payload: unknown,
  correlationId: string
): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("x-correlation-id", correlationId);
  response.end(JSON.stringify(payload));
}

function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function logQuestionMutation(entry: Readonly<Record<string, unknown>>): void {
  console.log(JSON.stringify({ level: "info", event: "question.mutation", ...entry }));
}

function logQuestionRelation(entry: Readonly<Record<string, unknown>>): void {
  console.log(JSON.stringify({ level: "info", event: "question.relation", ...entry }));
}

function logQuestionSemanticStructure(entry: Readonly<Record<string, unknown>>): void {
  console.log(JSON.stringify({ level: "info", event: "question.semantic_structure", ...entry }));
}

function logQuestionDiscovery(entry: Readonly<Record<string, unknown>>): void {
  console.log(JSON.stringify({ level: "info", event: "question.discovery", ...entry }));
}

function safeLogActor(actorId: string): string {
  return safeLogIdentifier(actorId);
}

function safeLogIdentifier(value: string): string {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) ? value : "invalid";
}

if (process.argv[1] && /(^|[\\/])server\.ts$/.test(process.argv[1])) {
  const application = createApiApplication();
  const shutdown = () => {
    void application.stop().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  void application
    .start()
    .then(() =>
      console.log(
        `Tech Club API listening on ${application.settings.application.host}:${application.settings.application.port}`
      )
    )
    .catch((error: unknown) => {
      console.error("API startup failed", error instanceof Error ? error.message : "unknown error");
      process.exitCode = 1;
    });
}
