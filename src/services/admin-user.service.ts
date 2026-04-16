import type { UserRole } from "@prisma/client";
import { UserRepository } from "@/src/repositories/user.repository";

export class AdminUserService {
  constructor(private readonly users: UserRepository) {}

  async listAllUsers() {
    return this.users.listAll();
  }

  async updateUserRole(targetUserId: string, role: UserRole) {
    const targetUser = await this.users.findById(targetUserId);
    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (targetUser.role === role) {
      const publicUser = await this.users.findPublicById(targetUserId);
      if (!publicUser) {
        throw new Error("User not found.");
      }
      return publicUser;
    }

    if (targetUser.role === "ADMIN" && role === "USER") {
      const adminCount = await this.users.countByRole("ADMIN");
      if (adminCount <= 1) {
        throw new Error("系統至少需要保留一位管理員。");
      }
    }

    return this.users.updateRole(targetUserId, role);
  }
}
