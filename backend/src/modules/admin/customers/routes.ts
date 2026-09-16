import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as customersService from "./service";
import { ok } from "../../../lib/response";

export default async function adminCustomerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAdminAuth(request);
  });

  app.get("/customers", async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional(), limit: z.coerce.number().optional() }).parse(request.query);
    const items = await customersService.listCustomers(query);
    return ok(items);
  });

  app.get("/customers/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const customer = await customersService.getCustomer(id);
    return ok(customer);
  });

  app.put("/customers/:id/status", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(request.body);
    const customer = await customersService.updateStatus(id, status);
    return ok(customer);
  });

  app.post("/customers/:id/notes", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { note } = z.object({ note: z.string().min(1).max(2000) }).parse(request.body);
    const created = await customersService.addNote(id, note, request.adminUserId!);
    reply.status(201);
    return ok(created);
  });
}
