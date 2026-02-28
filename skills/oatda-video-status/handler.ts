/**
 * OATDA Video Status Skill Handler
 *
 * Check the status of async video generation tasks.
 * API: GET /api/v1/llm/video-status/{taskId}
 *
 * @module oatda-video-status
 */

import {
  OatdaClient,
  type VideoStatusResponse,
} from '../../shared/client.js';
import { OatdaAuth } from '../../shared/auth.js';

/**
 * Video Status Result
 */
export interface VideoStatusResult {
  /** Task ID */
  taskId: string;
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Video URL (when completed) */
  videoUrl?: string;
  /** Direct video URL (alternative) */
  directVideoUrl?: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Error message (when failed) */
  errorMessage?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Cost information */
  cost?: {
    total: number;
    currency: string;
  };
}

/**
 * Main skill handler for video status checking
 *
 * @param taskId - The video generation task ID
 * @returns Current task status with video URL if completed
 */
export async function oatdaVideoStatus(
  taskId: string
): Promise<VideoStatusResult> {
  if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
    throw new Error(
      'Task ID is required. Get a task ID by generating a video with oatda-generate-video.'
    );
  }

  // Resolve API key
  const auth = new OatdaAuth();
  const apiKey = auth.getApiKey();

  // Create client
  const client = new OatdaClient({
    apiKey,
    timeout: 30000, // 30 seconds is enough for status check
  });

  // Make API request
  const response = await client.getVideoStatus(taskId.trim());

  // Handle errors
  if (!response.success || !response.data) {
    throw new Error(
      `OATDA Video Status Error: ${response.error?.message || 'Unknown error'}\n` +
      `Code: ${response.error?.code || 'UNKNOWN'}\n` +
      `Task ID: ${taskId}\n\n` +
      `Get help at: https://github.com/devcsde/oatda-skills/issues`
    );
  }

  const data = response.data as VideoStatusResponse;

  return {
    taskId: data.taskId,
    status: data.status,
    videoUrl: data.videoUrl,
    directVideoUrl: data.directVideoUrl,
    provider: data.provider,
    model: data.model,
    errorMessage: data.errorMessage,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    cost: data.costs
      ? {
          total: data.costs.totalCost,
          currency: data.costs.currency || 'USD',
        }
      : undefined,
  };
}

/**
 * Format video status result for display
 */
export function formatVideoStatusResult(result: VideoStatusResult): string {
  let output = `Video Task: ${result.taskId}\n`;
  output += `Status: ${result.status}\n`;
  output += `Model: ${result.provider}/${result.model}\n`;

  switch (result.status) {
    case 'completed':
      output += `\n✅ Video ready!\n`;
      if (result.videoUrl) {
        output += `Video URL: ${result.videoUrl}\n`;
      }
      if (result.directVideoUrl) {
        output += `Direct URL: ${result.directVideoUrl}\n`;
      }
      if (result.cost) {
        output += `\nCost: $${result.cost.total.toFixed(4)}`;
      }
      break;

    case 'failed':
      output += `\n❌ Generation failed\n`;
      if (result.errorMessage) {
        output += `Error: ${result.errorMessage}\n`;
      }
      break;

    case 'processing':
      output += `\n⏳ Video is being generated...\n`;
      output += `Check again in a moment.`;
      break;

    case 'pending':
      output += `\n⏳ Task queued, waiting to start...\n`;
      output += `Check again in a moment.`;
      break;
  }

  return output;
}
