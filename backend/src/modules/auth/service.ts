import { randomBytes, createHash } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { users, customerProfiles, refreshTokens, passwordResetTokens, emailOtps } from "../../db/schema/index";
import { hashPassword, verifyPassword } from "../../lib/password";
import { signAccessToken, generateRefreshTokenValue, hashRefreshToken, refreshTokenExpiry } from "../../lib/jwt";
import { ApiError } from "../../lib/errors";
import { sendMail, emailTemplates } from "../../lib/mailer";
import { env } from "../../config/env";

async function issueTokenPair(userId: string, deviceInfo?: string) {
  const accessToken = await signAccessToken({ sub: userId, role: "customer" });
  const refreshValue = generateRefreshTokenValue();
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashRefreshToken(refreshValue),
    deviceInfo: deviceInfo?.slice(0, 300),
    expiresAt: refreshTokenExpiry(),
  });
  return { accessToken, refreshToken: refreshValue };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  deviceInfo?: string;
}) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
  if (existing) throw ApiError.conflict("An account with this email already exists", "email_taken");

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({ email: input.email.toLowerCase(), phone: input.phone, passwordHash })
    .returning();

  await db.insert(customerProfiles).values({
    userId: user.id,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  const tokens = await issueTokenPair(user.id, input.deviceInfo);
  return { user, ...tokens };
}

export async function login(input: { email: string; password: string; deviceInfo?: string }) {
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
  if (!user || !user.passwordHash) throw ApiError.unauthorized("Invalid email or password", "invalid_credentials");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password", "invalid_credentials");
  if (user.status !== "active") throw ApiError.forbidden("Account is not active", "account_inactive");

  const tokens = await issueTokenPair(user.id, input.deviceInfo);
  return { user, ...tokens };
}

export async function refresh(refreshTokenValue: string) {
  const tokenHash = hashRefreshToken(refreshTokenValue);
  const record = await db.query.refreshTokens.findFirst({ where: eq(refreshTokens.tokenHash, tokenHash) });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired", "invalid_refresh_token");
  }

  // Rotate: revoke old, issue new
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, record.id));
  const tokens = await issueTokenPair(record.userId, record.deviceInfo ?? undefined);
  return tokens;
}

export async function logout(refreshTokenValue: string) {
  const tokenHash = hashRefreshToken(refreshTokenValue);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  // Always behave the same whether or not the account exists (no user enumeration).
  if (!user) return;

  const value = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(value).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${value}`;
  await sendMail(user.email, "Reset your Arca password", emailTemplates.passwordReset(resetUrl));
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.query.passwordResetTokens.findFirst({ where: eq(passwordResetTokens.tokenHash, tokenHash) });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired", "invalid_reset_token");
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));
  // Revoke all active sessions on password change
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.userId, record.userId));
}

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 45;

// The code itself is never persisted — only a hash salted with the user's id
// and peppered with a server secret, so a 6-digit code can't be reversed
// from a DB dump the way a plain/unsalted hash of a low-entropy value could.
function hashOtpCode(code: string, userId: string) {
  return createHash("sha256").update(`${code}:${userId}:${env.JWT_ACCESS_SECRET}`).digest("hex");
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestLoginOtp(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  // Same response whether or not the account exists (no user enumeration) —
  // and silently skip sending if one was just issued, rather than surfacing
  // a distinguishable "please wait" error.
  if (!user) return;

  const recent = await db.query.emailOtps.findFirst({
    where: and(eq(emailOtps.userId, user.id), isNull(emailOtps.usedAt)),
    orderBy: [desc(emailOtps.createdAt)],
  });
  if (recent && recent.createdAt.getTime() > Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    return;
  }

  // Invalidate any still-active previous codes so only the newest one works.
  await db
    .update(emailOtps)
    .set({ usedAt: new Date() })
    .where(and(eq(emailOtps.userId, user.id), isNull(emailOtps.usedAt)));

  const code = generateOtpCode();
  await db.insert(emailOtps).values({
    userId: user.id,
    codeHash: hashOtpCode(code, user.id),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
  });

  await sendMail(user.email, "Your Arca sign-in code", emailTemplates.loginOtp(code, OTP_TTL_MINUTES));
}

export async function verifyLoginOtp(email: string, code: string, deviceInfo?: string) {
  const invalidError = () => ApiError.badRequest("That code is invalid or has expired", "invalid_otp");

  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  if (!user) throw invalidError();

  const record = await db.query.emailOtps.findFirst({
    where: and(eq(emailOtps.userId, user.id), isNull(emailOtps.usedAt)),
    orderBy: [desc(emailOtps.createdAt)],
  });
  if (!record || record.expiresAt < new Date()) throw invalidError();
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Too many incorrect attempts — request a new code", "otp_locked");
  }

  if (hashOtpCode(code, user.id) !== record.codeHash) {
    await db.update(emailOtps).set({ attempts: record.attempts + 1 }).where(eq(emailOtps.id, record.id));
    throw invalidError();
  }

  await db.update(emailOtps).set({ usedAt: new Date() }).where(eq(emailOtps.id, record.id));
  if (user.status !== "active") throw ApiError.forbidden("Account is not active", "account_inactive");

  const tokens = await issueTokenPair(user.id, deviceInfo);
  return { user, ...tokens };
}
