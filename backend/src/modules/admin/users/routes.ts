import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as usersService from "./service";
import { ok } from "../../../lib/response";

const ROLES = ["admin", "manager", "support", "viewer"] as const;

export default async function adminUserRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAdminAuth(request);
  });

  app.get("/users", async () => {
    const items = await usersService.listUsers();
    return ok(items);
  });

  app.post("/users", async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        password: z.string().min(8).max(100),
        role: z.enum(ROLES).default("support"),
      })
      .parse(request.body);
    const created = await usersService.createUser(body);
    reply.status(201);
    return ok(created);
  });

  app.put("/users/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ name: z.string().min(1).max(200).optional(), role: z.enum(ROLES).optional() }).parse(request.body);
    const updated = await usersService.updateUser(id, body);
    return ok(updated);
  });

  app.put("/users/:id/status", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(request.body);
    const updated = await usersService.updateStatus(id, status, request.adminUserId!);
    return ok(updated);
  });
}
