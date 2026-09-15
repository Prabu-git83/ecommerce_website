import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";

declare module "fastify" {
  interface FastifyRequest {
    userId: string | null;
  }
}

async function resolveUser(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest("userId", null);

  app.addHook("preHandler", async (request) => {
    request.userId = await resolveUser(request);
  });

  app.decorate("requireAuth", async (request: FastifyRequest) => {
    if (!request.userId) throw ApiError.unauthorized();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest) => Promise<void>;
  }
}
