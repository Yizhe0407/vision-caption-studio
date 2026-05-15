import { z } from "zod";
import { TagDictionaryService } from "@/src/services/tag-dictionary.service";

const categorySchema = z.enum([
  "category", "product_type", "shape", "material", "texture",
  "pattern", "pattern_layout", "technique", "color.primary",
  "color.secondary", "color.accent", "style", "details", "mood",
]);

export class TagDictionaryController {
  constructor(private readonly service: TagDictionaryService) {}

  async getDictionary(payload: unknown) {
    const { userId } = z.object({ userId: z.string().min(1) }).parse(payload);
    return this.service.getDictionary(userId);
  }

  async addEntry(payload: unknown) {
    const { userId, category, value } = z.object({
      userId: z.string().min(1),
      category: categorySchema,
      value: z.string().min(1).max(100),
    }).parse(payload);
    return this.service.addEntry(userId, category, value);
  }

  async deleteEntry(payload: unknown) {
    const { userId, entryId } = z.object({
      userId: z.string().min(1),
      entryId: z.string().min(1),
    }).parse(payload);
    await this.service.deleteEntry(userId, entryId);
  }
}
