import { z } from "zod";
import { TagKeyService } from "@/src/services/tag-key.service";

export class TagKeyController {
  constructor(private readonly service: TagKeyService) {}

  async getKeys(payload: unknown) {
    const { userId } = z.object({ userId: z.string().min(1) }).parse(payload);
    return this.service.getKeys(userId);
  }

  async addKey(payload: unknown) {
    const { userId, key } = z
      .object({ userId: z.string().min(1), key: z.string().min(1).max(50) })
      .parse(payload);
    return this.service.addKey(userId, key);
  }

  async deleteKey(payload: unknown) {
    const { userId, id } = z
      .object({ userId: z.string().min(1), id: z.string().min(1) })
      .parse(payload);
    await this.service.deleteKey(userId, id);
  }
}
