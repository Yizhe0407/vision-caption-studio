import { TagDictionaryRepository } from "@/src/repositories/tag-dictionary.repository";

const VALID_CATEGORIES = [
  "category", "product_type", "shape", "material", "texture",
  "pattern", "pattern_layout", "technique", "color.primary",
  "color.secondary", "color.accent", "style", "details", "mood",
] as const;

const DEFAULT_VALUES: Record<string, string[]> = {
  material: ["cotton", "denim", "leather", "linen", "nylon", "polyester", "rayon", "satin", "silk", "velvet", "wool"],
  texture: ["embossed", "glossy", "knit", "matte", "rough", "sheer", "smooth", "soft", "stiff", "woven"],
  pattern: ["abstract", "animal", "checkered", "floral", "geometric", "paisley", "plaid", "polka dot", "solid", "stripe"],
  style: ["bohemian", "casual", "classic", "elegant", "formal", "minimalist", "modern", "sporty", "vintage"],
  technique: ["embroidered", "hand-stitched", "knitted", "printed", "quilted", "woven"],
  "color.primary": ["beige", "black", "blue", "brown", "cream", "gold", "green", "grey", "navy", "orange", "pink", "purple", "red", "silver", "white", "yellow"],
  "color.secondary": ["beige", "black", "blue", "brown", "cream", "gold", "green", "grey", "navy", "orange", "pink", "purple", "red", "silver", "white", "yellow"],
  "color.accent": ["beige", "black", "blue", "brown", "cream", "gold", "green", "grey", "navy", "orange", "pink", "purple", "red", "silver", "white", "yellow"],
  details: ["buttons", "collar", "cuffs", "fringe", "hood", "lace", "pockets", "ruffles", "sequins", "zipper"],
  mood: ["calm", "casual", "dramatic", "elegant", "energetic", "festive", "playful", "romantic", "sophisticated"],
  shape: ["a-line", "boxy", "fitted", "flared", "oversized", "relaxed", "slim", "structured", "tapered"],
  category: ["accessories", "bottoms", "dresses", "footwear", "outerwear", "swimwear", "tops", "underwear"],
  product_type: ["blouse", "boots", "cardigan", "coat", "dress", "jacket", "jeans", "shirt", "shorts", "skirt", "sneakers", "suit", "sweater", "t-shirt", "trousers"],
  pattern_layout: ["allover", "border", "center", "directional", "engineered", "scattered"],
};

export class TagDictionaryService {
  constructor(private readonly repo: TagDictionaryRepository) {}

  async getDictionary(userId: string) {
    const count = await this.repo.countByUser(userId);
    if (count === 0) {
      await this.seedDefaults(userId);
    }
    return this.repo.listByUser(userId);
  }

  async addEntry(userId: string, category: string, value: string) {
    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      throw new Error(`Invalid category: ${category}`);
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) throw new Error("Tag value cannot be empty.");
    try {
      return await this.repo.create(userId, category, trimmed, false);
    } catch {
      // unique constraint violation — already exists, silently ignore
      const all = await this.repo.listByUser(userId);
      return all.find((e) => e.category === category && e.value === trimmed) ?? null;
    }
  }

  async deleteEntry(userId: string, entryId: string) {
    const entry = await this.repo.findById(entryId);
    if (!entry) throw new Error("Tag not found.");
    if (entry.userId !== userId) throw new Error("Not authorized.");
    if (entry.isDefault) throw new Error("Default tags cannot be deleted.");
    await this.repo.delete(entryId);
  }

  private async seedDefaults(userId: string) {
    const inserts = Object.entries(DEFAULT_VALUES).flatMap(([category, values]) =>
      values.map((value) =>
        this.repo.create(userId, category, value, true).catch(() => null)
      )
    );
    await Promise.all(inserts);
  }
}
