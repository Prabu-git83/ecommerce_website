import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../../db/client";
import { adminUsers } from "../../../db/schema/index";
import { eq } from "drizzle-orm";
import { ok } from "../../../lib/response";
import { ApiError } from "../../../lib/errors";
import * as adminAuthService from "./service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request) => {
    const body = loginSchema.parse(request.body);
    const { admin, accessToken } = await adminAuthService.login(body.email, body.password);
    return ok({ admin: adminAuthService.publicAdminUser(admin), accessToken });
  });

  app.get("/auth/me", async (request) => {
    await app.requireAdminAuth(request);
    const admin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, request.adminUserId!) });
    if (!admin) throw ApiError.notFound("Admin user not found");
    return ok(adminAuthService.publicAdminUser(admin));
  });
}
