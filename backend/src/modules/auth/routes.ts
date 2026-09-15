import type { FastifyInstance } from "fastify";
import * as authService from "./service";
import { mergeGuestCartIntoUser } from "../cart/service";
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from "./schemas";
import { ok } from "../../lib/response";
import { db } from "../../db/client";
import { customerProfiles } from "../../db/schema/index";
import { eq } from "drizzle-orm";
import { ApiError } from "../../lib/errors";

function publicUser(user: { id: string; email: string; phone: string | null; emailVerified: boolean }) {
  return { id: user.id, email: user.email, phone: user.phone, emailVerified: user.emailVerified };
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const deviceInfo = request.headers["user-agent"] as string | undefined;
    const { user, accessToken, refreshToken } = await authService.register({ ...body, deviceInfo });
    await mergeGuestCartIntoUser(request.cartToken, user.id);
    reply.status(201);
    return ok({ user: publicUser(user), accessToken, refreshToken });
  });

  app.post("/auth/login", async (request) => {
    const body = loginSchema.parse(request.body);
    const deviceInfo = request.headers["user-agent"] as string | undefined;
    const { user, accessToken, refreshToken } = await authService.login({ ...body, deviceInfo });
    await mergeGuestCartIntoUser(request.cartToken, user.id);
    return ok({ user: publicUser(user), accessToken, refreshToken });
  });

  app.post("/auth/refresh", async (request) => {
    const body = refreshSchema.parse(request.body);
    const tokens = await authService.refresh(body.refreshToken);
    return ok(tokens);
  });

  app.post("/auth/logout", async (request) => {
    const body = refreshSchema.parse(request.body);
    await authService.logout(body.refreshToken);
    return ok({ success: true });
  });

  app.post("/auth/forgot-password", async (request) => {
    const body = forgotPasswordSchema.parse(request.body);
    await authService.requestPasswordReset(body.email);
    return ok({ success: true });
  });

  app.post("/auth/reset-password", async (request) => {
    const body = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(body.token, body.password);
    return ok({ success: true });
  });

  app.get("/customers/me", async (request) => {
    await app.requireAuth(request);
    const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, request.userId!) });
    if (!user) throw ApiError.notFound("User not found");
    const profile = await db.query.customerProfiles.findFirst({ where: eq(customerProfiles.userId, user.id) });
    return ok({ ...publicUser(user), firstName: profile?.firstName, lastName: profile?.lastName, avatarUrl: profile?.avatarUrl });
  });
}
