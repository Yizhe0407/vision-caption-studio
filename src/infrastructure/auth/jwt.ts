import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { env } from "@/src/lib/env";

export type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function signAccessToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_EXPIRES_IN_SEC}s`)
    .sign(accessSecret);
}

export async function signRefreshToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_REFRESH_EXPIRES_IN_SEC}s`)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string) {
  const verified = await jwtVerify<TokenPayload>(token, accessSecret);
  return verified.payload;
}

export async function verifyRefreshToken(token: string) {
  const verified = await jwtVerify<TokenPayload>(token, refreshSecret);
  return verified.payload;
}
