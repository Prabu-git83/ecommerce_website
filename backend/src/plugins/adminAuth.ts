import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { verifyAdminAccessToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";

declare module "fastify" {
  interface FastifyRequest {
    adminUserId: string | null;
    adminRole: string | null;
    adminPermissions: string[] | null;
  }
}

async function resolveAdmin(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyAdminAccessToken(token);
    return { id: payload.sub, role: payload.adminRole, permissions: payload.adminPermissions ?? [] };
  } catch {
    return null;
  }
}

// Registered only inside the /v1/admin sub-scope, so customer-facing
// requests never pay the cost of (or risk of) admin token verification.
export default fp(async (app: FastifyInstance) => {
  app.decorateRequest("adminUserId", null);
  app.decorateRequest("adminRole", null);
  app.decorateRequest("adminPermissions", null);

  app.addHook("preHandler", async (request) => {
    const admin = await resolveAdmin(request);
    request.adminUserId = admin?.id ?? null;
    request.adminRole = admin?.role ?? null;
    request.adminPermissions = admin?.permissions ?? [];
  });

  app.decorate("requireAdminAuth", async (request: FastifyRequest) => {
    if (!request.adminUserId) throw ApiError.unauthorized("Admin authentication required", "admin_unauthorized");
  });

  app.decorate("requireSuperAdmin", async (request: FastifyRequest) => {
    if (!request.adminUserId) throw ApiError.unauthorized("Admin authentication required", "admin_unauthorized");
    if (request.adminRole !== "super_admin") throw ApiError.forbidden("Super admin access required", "super_admin_required");
  });

  app.decorate("requirePermission", async (request: FastifyRequest, keys: string[]) => {
    if (!request.adminUserId) throw ApiError.unauthorized("Admin authentication required", "admin_unauthorized");
    if (request.adminRole === "super_admin") return;
    const allowed = keys.some((k) => (request.adminPermissions ?? []).includes(k));
    if (!allowed) throw ApiError.forbidden("You don't have access to this section", "permission_denied");
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireAdminAuth: (request: FastifyRequest) => Promise<void>;
    requireSuperAdmin: (request: FastifyRequest) => Promise<void>;
    requirePermission: (request: FastifyRequest, keys: string[]) => Promise<void>;
  }
}
