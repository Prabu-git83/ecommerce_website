import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "node:crypto";
import { env } from "../config/env";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export type AccessTokenPayload = {
  sub: string;
  role: "customer";
};

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as AccessTokenPayload;
}

// Admin sessions share the same signing key but carry role: "admin" and a
// longer, fixed 8-hour expiry (no refresh rotation) — an internal tool,
// re-login after a shift is an acceptable tradeoff for not building a second
// refresh-token pipeline.
export type AdminTokenPayload = {
  sub: string;
  role: "admin";
  adminRole: string;
};

export async function signAdminAccessToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(accessSecret);
}

export async function verifyAdminAccessToken(token: string): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  if ((payload as any).role !== "admin") throw new Error("Not an admin token");
  return payload as unknown as AdminTokenPayload;
}

// Refresh tokens are opaque random strings; only their hash is stored in the DB
// (mirrors the blueprint's "opaque, device-bound, rotated on every use" design).
export function generateRefreshTokenValue(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(value: string): string {
  return createHash("sha256").update(value + env.JWT_REFRESH_SECRET).digest("hex");
}

export function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.JWT_REFRESH_TTL_DAYS);
  return d;
}
