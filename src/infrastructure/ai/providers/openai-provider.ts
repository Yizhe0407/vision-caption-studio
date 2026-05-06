import OpenAI from "openai";
import type { AIProvider, GenerateCaptionInput, GenerateCaptionResult } from "@/src/infrastructure/ai/types";
import { parseGeneratedOutput } from "@/src/infrastructure/ai/providers/parse-generated-output";

const TAGS_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string" },
    product_type: { type: "string" },
    shape: { type: "string" },
    material: { type: "array", items: { type: "string" } },
    texture: { type: "array", items: { type: "string" } },
    pattern: { type: "array", items: { type: "string" } },
    pattern_layout: { type: "string" },
    technique: { type: "array", items: { type: "string" } },
    color: {
      type: "object",
      properties: {
        primary: { type: "array", items: { type: "string" } },
        secondary: { type: "array", items: { type: "string" } },
        accent: { type: "array", items: { type: "string" } },
      },
      required: ["primary", "secondary", "accent"],
      additionalProperties: false,
    },
    style: { type: "array", items: { type: "string" } },
    details: { type: "array", items: { type: "string" } },
    mood: { type: "array", items: { type: "string" } },
  },
  required: [
    "category", "product_type", "shape", "material", "texture",
    "pattern", "pattern_layout", "technique", "color", "style", "details", "mood",
  ],
  additionalProperties: false,
} as const;

export class OpenAIProvider implements AIProvider {
  constructor(private readonly client: OpenAI) {}

  async generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
    const imageBase64 = input.imageBuffer.toString("base64");
    const response = await this.client.responses.create({
      model: input.model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: input.prompt },
            {
              type: "input_image",
              image_url: `data:${input.mimeType};base64,${imageBase64}`,
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "caption_tags",
          strict: true,
          schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              tags: TAGS_SCHEMA,
            },
            required: ["description", "tags"],
            additionalProperties: false,
          },
        },
      },
    });

    const outputText = response.output_text;
    const parsed = parseGeneratedOutput(outputText);

    return {
      caption: parsed.caption,
      tags: parsed.tags,
      structuredTags: parsed.structuredTags,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }
}
