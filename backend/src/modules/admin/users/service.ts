import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { adminUsers } from "../../../db/schema/index";
import { ApiError } from "../../../lib/errors";
import { hashPassword } from "../../../lib/password";

function publicUser(u: typeof adminUsers.$inferSelect) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function listUsers() {
  const rows = await db.query.adminUsers.findMany({ orderBy: [desc(adminUsers.createdAt)] });
  return rows.map(publicUser);
}

export async function createUser(input: { name: string; email: string; password: string; role: string }) {
  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, input.email) });
  if (existing) throw ApiError.conflict("An admin with this email already exists", "email_taken");
  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(adminUsers)
    .values({ name: input.name, email: input.email, passwordHash, role: input.role })
    .returning();
  return publicUser(created);
}

export async function updateUser(id: string, input: { name?: string; role?: string }) {
  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  if (!existing) throw ApiError.notFound("Admin user not found");
  const [updated] = await db
    .update(adminUsers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(adminUsers.id, id))
    .returning();
  return publicUser(updated);
}

export async function updateStatus(id: string, status: "active" | "suspended", requestingAdminId: string) {
  if (id === requestingAdminId && status === "suspended") {
    throw ApiError.badRequest("You can't suspend your own account", "cannot_suspend_self");
  }
  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  if (!existing) throw ApiError.notFound("Admin user not found");
  const [updated] = await db.update(adminUsers).set({ status, updatedAt: new Date() }).where(eq(adminUsers.id, id)).returning();
  return publicUser(updated);
}
