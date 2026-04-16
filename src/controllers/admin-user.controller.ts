import { z } from "zod";
import { AdminUserService } from "@/src/services/admin-user.service";

export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  async list() {
    return this.service.listAllUsers();
  }

  async updateRole(payload: unknown) {
    const parsed = z
      .object({
        userId: z.string().min(1),
        role: z.enum(["USER", "ADMIN"]),
      })
      .parse(payload);

    return this.service.updateUserRole(parsed.userId, parsed.role);
  }
}
