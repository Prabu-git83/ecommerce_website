import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send({
        data: null,
        meta: null,
        error: { code: error.code, message: error.message, fields: error.fields ?? null },
      });
      return;
    }

    if (error instanceof ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of error.issues) {
        fields[issue.path.join(".") || "_"] = issue.message;
      }
      reply.status(400).send({
        data: null,
        meta: null,
        error: { code: "validation_error", message: "Invalid request", fields },
      });
      return;
    }

    // fastify-type-provider-zod attaches validation errors with statusCode 400
    if ((error as any).statusCode === 400 && (error as any).code === "FST_ERR_VALIDATION") {
      reply.status(400).send({
        data: null,
        meta: null,
        error: { code: "validation_error", message: (error as Error).message, fields: null },
      });
      return;
    }

    app.log.error(error);
    const statusCode = (error as any).statusCode ?? 500;
    reply.status(statusCode).send({
      data: null,
      meta: null,
      error: {
        code: statusCode === 500 ? "internal_error" : "request_error",
        message: statusCode === 500 ? "Something went wrong" : (error as Error).message,
        fields: null,
      },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      data: null,
      meta: null,
      error: { code: "not_found", message: "Route not found", fields: null },
    });
  });
}
