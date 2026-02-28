/**
 * OATDA Image Generation Skill Handler
 *
 * Generate images using AI models.
 * API: POST /api/v1/llm/generate-image
 *
 * @module oatda-generate-image
 */

import {
  OatdaClient,
  type ImageGenerationParams,
  type ImageGenerationResponse,
} from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * Image Generation Result
 */
export interface ImageGenerationResult {
  /** Generated image URLs */
  urls: string[];
  /** Revised prompt (if applicable) */
  revisedPrompt?: string;
  /** Model used */
  model: string;
  /** Provider used */
  provider: string;
  /** Cost information */
  cost?: {
    total: number;
    currency: string;
  };
}

/**
 * Main skill handler for image generation
 *
 * @param params - Image generation parameters
 * @param params.model - Image model ID (e.g., "openai/dall-e-3")
 * @param params.prompt - Image description (1-4000 chars)
 * @param params.size - Image dimensions (e.g., "1024x1024")
 * @param params.quality - Image quality level
 * @param params.n - Number of images (1-10)
 * @param params.aspectRatio - Aspect ratio for the image
 * @param params.style - "vivid" or "natural"
 * @returns Generated image URLs with metadata
 */
export async function oatdaGenerateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  // Resolve API key
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client
  const client = new OatdaClient({
    apiKey,
    timeout: 120000,
  });

  // Make API request
  const response = await client.generateImage(params);

  // Handle errors
  if (!response.success || !response.data) {
    throw new Error(
      `OATDA Image API Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  const [provider, modelName] = params.model.split('/');

  return {
    urls: response.data.urls,
    revisedPrompt: response.data.revisedPrompt,
    model: modelName,
    provider,
    cost: response.usage
      ? {
          total: response.usage.cost,
          currency: 'USD',
        }
      : undefined,
  };
}

/**
 * Format image generation result for display
 */
export function formatImageResult(result: ImageGenerationResult): string {
  let output = `Generated ${result.urls.length} image(s):\n`;

  result.urls.forEach((url, i) => {
    output += `\n${i + 1}. ${url}`;
  });

  if (result.revisedPrompt) {
    output += `\n\nRevised prompt: ${result.revisedPrompt}`;
  }

  output += '\n\n---\n';
  output += `Model: ${result.provider}/${result.model}`;

  if (result.cost) {
    output += `\nCost: $${result.cost.total.toFixed(6)}`;
  }

  return output;
}
