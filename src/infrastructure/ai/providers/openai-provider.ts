import OpenAI from "openai";
import type { AIProvider, GenerateCaptionInput, GenerateCaptionResult } from "@/src/infrastructure/ai/types";
import { parseGeneratedOutput } from "@/src/infrastructure/ai/providers/parse-generated-output";

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
              tags: { type: "array", items: { type: "string" } },
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
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }
}
