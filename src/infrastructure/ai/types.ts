export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type StructuredTags = {
  category: string;
  product_type: string;
  shape: string;
  material: string[];
  texture: string[];
  pattern: string[];
  pattern_layout: string;
  technique: string[];
  color: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  style: string[];
  details: string[];
  mood: string[];
};

export type GenerateCaptionInput = {
  prompt: string;
  mimeType: string;
  imageBuffer: Buffer;
  model: string;
};

export type GenerateCaptionResult = {
  caption: string;
  tags: string[];
  structuredTags?: StructuredTags;
  usage: AIUsage;
};

export interface AIProvider {
  generateCaptionAndTags(input: GenerateCaptionInput): Promise<GenerateCaptionResult>;
}
