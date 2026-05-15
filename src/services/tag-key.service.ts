import { TagKeyRepository } from "@/src/repositories/tag-key.repository";

const DEFAULT_KEYS = [
  "category",
  "product_type",
  "shape",
  "material",
  "texture",
  "pattern",
  "pattern_layout",
  "technique",
  "color.primary",
  "color.secondary",
  "color.accent",
  "style",
  "details",
  "mood",
];

export class TagKeyService {
  constructor(private readonly repo: TagKeyRepository) {}

  async getKeys(userId: string) {
    const count = await this.repo.countByUser(userId);
    if (count === 0) {
      await this.seedDefaults(userId);
    }
    return this.repo.listByUser(userId);
  }

  async addKey(userId: string, key: string) {
    const normalized = key.trim().toLowerCase().replace(/\s+/g, "_");
    if (!normalized) throw new Error("Tag key cannot be empty.");
    if (normalized.length > 50) throw new Error("Tag key is too long (max 50 characters).");
    try {
      return await this.repo.create(userId, normalized, false);
    } catch {
      // unique constraint — already exists
      const existing = await this.repo.listByUser(userId);
      return existing.find((e) => e.key === normalized) ?? null;
    }
  }

  async deleteKey(userId: string, id: string) {
    const entry = await this.repo.findById(id);
    if (!entry) throw new Error("Tag key not found.");
    if (entry.userId !== userId) throw new Error("Not authorized.");
    if (entry.isDefault) throw new Error("Default tag keys cannot be deleted.");
    await this.repo.delete(id);
  }

  async getKeysForGeneration(userId: string): Promise<string[]> {
    const count = await this.repo.countByUser(userId);
    if (count === 0) await this.seedDefaults(userId);
    return this.repo.getKeysForUser(userId);
  }

  private async seedDefaults(userId: string) {
    await Promise.all(
      DEFAULT_KEYS.map((key) => this.repo.create(userId, key, true).catch(() => null))
    );
  }
}
