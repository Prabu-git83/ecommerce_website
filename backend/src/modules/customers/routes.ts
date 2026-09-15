import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/client";
import { customerProfiles, users, addresses } from "../../db/schema/index";
import { ok } from "../../lib/response";
import { ApiError } from "../../lib/errors";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]).default("shipping"),
  fullName: z.string().min(1).max(200),
  phone: z.string().min(6).max(20).optional(),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postcode: z.string().min(3).max(20),
  countryCode: z.string().length(2).default("IN"),
  isDefault: z.boolean().default(false),
});

export default async function customerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await app.requireAuth(request);
  });

  app.put("/customers/me", async (request) => {
    const body = updateProfileSchema.parse(request.body);
    const userId = request.userId!;

    if (body.phone) {
      await db.update(users).set({ phone: body.phone, updatedAt: new Date() }).where(eq(users.id, userId));
    }
    await db
      .update(customerProfiles)
      .set({
        ...(body.firstName ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
      })
      .where(eq(customerProfiles.userId, userId));

    const profile = await db.query.customerProfiles.findFirst({ where: eq(customerProfiles.userId, userId) });
    return ok(profile);
  });

  app.get("/customers/me/addresses", async (request) => {
    const list = await db.query.addresses.findMany({
      where: eq(addresses.userId, request.userId!),
      orderBy: (a, { desc }) => [desc(a.isDefault), desc(a.createdAt)],
    });
    return ok(list);
  });

  app.post("/customers/me/addresses", async (request, reply) => {
    const body = addressSchema.parse(request.body);
    const userId = request.userId!;

    if (body.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [created] = await db.insert(addresses).values({ ...body, userId }).returning();
    reply.status(201);
    return ok(created);
  });

  app.put("/customers/me/addresses/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = addressSchema.partial().parse(request.body);
    const userId = request.userId!;

    const existing = await db.query.addresses.findFirst({ where: and(eq(addresses.id, id), eq(addresses.userId, userId)) });
    if (!existing) throw ApiError.notFound("Address not found");

    if (body.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [updated] = await db.update(addresses).set(body).where(eq(addresses.id, id)).returning();
    return ok(updated);
  });

  app.delete("/customers/me/addresses/:id", async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const userId = request.userId!;
    const existing = await db.query.addresses.findFirst({ where: and(eq(addresses.id, id), eq(addresses.userId, userId)) });
    if (!existing) throw ApiError.notFound("Address not found");
    await db.delete(addresses).where(eq(addresses.id, id));
    return ok({ success: true });
  });
}
