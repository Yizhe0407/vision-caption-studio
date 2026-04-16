import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { UserRole } from "@prisma/client";
import { env } from "@/src/lib/env";
import { UserRepository } from "@/src/repositories/user.repository";
import { RefreshTokenRepository } from "@/src/repositories/refresh-token.repository";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/src/infrastructure/auth/jwt";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async register(email: string, password: string): Promise<AuthTokens> {
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new Error("Email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await this.users.createWithAutoRole(email, passwordHash);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Email already exists.");
      }
      throw error;
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new Error("Invalid credentials.");
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await verifyRefreshToken(refreshToken);
    const consumed = await this.refreshTokens.consumeValid(refreshToken);
    if (consumed.count !== 1) {
      throw new Error("Invalid refresh token.");
    }
    const user = await this.users.findById(payload.userId);
    if (!user) {
      throw new Error("Invalid refresh token.");
    }

    await this.refreshTokens.revoke(refreshToken);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string) {
    await this.refreshTokens.revoke(refreshToken);
  }

  private async issueTokens(userId: string, email: string, role: UserRole): Promise<AuthTokens> {
    const accessToken = await signAccessToken({ userId, email, role });
    const refreshToken = await signRefreshToken({ userId, email, role });

    await this.refreshTokens.create(
      userId,
      refreshToken,
      new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_SEC * 1000),
    );

    return { accessToken, refreshToken };
  }
}
