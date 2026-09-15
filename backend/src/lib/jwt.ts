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
