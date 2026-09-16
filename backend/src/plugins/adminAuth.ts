import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { verifyAdminAccessToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";

declare module "fastify" {
  interface FastifyRequest {
    adminUserId: string | null;
    adminRole: string | null;
  }
}

async function resolveAdmin(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyAdminAccessToken(token);
    return { id: payload.sub, role: payload.adminRole };
  } catch {
    return null;
  }
}

// Registered only inside the /v1/admin sub-scope, so customer-facing
// requests never pay the cost of (or risk of) admin token verification.
export default fp(async (app: FastifyInstance) => {
  app.decorateRequest("adminUserId", null);
  app.decorateRequest("adminRole", null);

  app.addHook("preHandler", async (request) => {
    const admin = await resolveAdmin(request);
    request.adminUserId = admin?.id ?? null;
    request.adminRole = admin?.role ?? null;
  });

  app.decorate("requireAdminAuth", async (request: FastifyRequest) => {
    if (!request.adminUserId) throw ApiError.unauthorized("Admin authentication required", "admin_unauthorized");
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireAdminAuth: (request: FastifyRequest) => Promise<void>;
  }
}
