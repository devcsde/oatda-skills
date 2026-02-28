/**
 * OATDA Video Generation Skill Handler
 *
 * Generate videos using AI models (async).
 * API: POST /api/v1/llm/generate-video?async=true
 *
 * Video generation is asynchronous. This handler returns a task ID
 * that can be polled with oatda-video-status.
 *
 * @module oatda-generate-video
 */

import {
  OatdaClient,
  type VideoGenerationParams,
  type VideoGenerationResponse,
} from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * Video Generation Result
 */
export interface VideoGenerationResult {
  /** Task ID for polling status */
  taskId: string;
  /** Initial task status */
  status: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Human-readable message */
  message: string;
  /** URL to poll for status */
  pollUrl?: string;
}

/**
 * Main skill handler for video generation
 *
 * @param params - Video generation parameters
 * @param params.model - Video model ID (e.g., "minimax/T2V-01")
 * @param params.prompt - Video description (1-4000 chars)
 * @param params.duration - Duration in seconds
 * @param params.resolution - "720P" or "1080P"
 * @param params.aspectRatio - "16:9", "9:16", or "1:1"
 * @returns Task ID and status for polling
 */
export async function oatdaGenerateVideo(
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  // Resolve API key
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client with longer timeout for video
  const client = new OatdaClient({
    apiKey,
    timeout: 180000, // 3 minutes
  });

  // Make API request (async mode — returns task ID)
  const response = await client.generateVideo(params);

  // Handle errors
  if (!response.success || !response.data) {
    throw new Error(
      `OATDA Video API Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  const data = response.data as VideoGenerationResponse;
  const [provider, modelName] = params.model.split('/');

  return {
    taskId: data.taskId,
    status: data.status || 'pending',
    provider: data.provider || provider,
    model: data.model || modelName,
    message:
      data.message ||
      `Video generation started. Use oatda-video-status with task ID "${data.taskId}" to check status.`,
    pollUrl: data.pollUrl,
  };
}

/**
 * Format video generation result for display
 */
export function formatVideoResult(result: VideoGenerationResult): string {
  let output = `Video generation started!\n\n`;
  output += `Task ID: ${result.taskId}\n`;
  output += `Status: ${result.status}\n`;
  output += `Model: ${result.provider}/${result.model}\n\n`;
  output += `Check status with:\n`;
  output += `> Check the video generation status for task ${result.taskId}`;

  return output;
}
