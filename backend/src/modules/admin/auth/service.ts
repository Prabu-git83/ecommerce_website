import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { adminUsers } from "../../../db/schema/index";
import { verifyPassword } from "../../../lib/password";
import { signAdminAccessToken } from "../../../lib/jwt";
import { ApiError } from "../../../lib/errors";

export function publicAdminUser(admin: { id: string; email: string; name: string; role: string }) {
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function login(email: string, password: string) {
  const admin = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email.toLowerCase()) });
  if (!admin) throw ApiError.unauthorized("Invalid email or password", "invalid_credentials");

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password", "invalid_credentials");
  if (admin.status !== "active") throw ApiError.forbidden("This admin account is not active", "account_inactive");

  const accessToken = await signAdminAccessToken({ sub: admin.id, role: "admin", adminRole: admin.role });
  return { admin, accessToken };
}
