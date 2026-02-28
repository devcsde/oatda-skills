/**
 * OATDA API Client for Skills
 *
 * Provides a unified interface for all OATDA skills to communicate
 * with the OATDA API endpoint. Handles authentication, error handling,
 * and response parsing.
 *
 * @module oatda-client
 */

/**
 * OATDA Client Configuration
 */
export interface OatdaClientConfig {
  /** OATDA API base URL (default: https://oatda.com) */
  baseUrl?: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds (default: 120000) */
  timeout?: number;
  /** Custom user agent for requests */
  userAgent?: string;
}

/**
 * OATDA API Response Wrapper
 */
export interface OatdaResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: OatdaError;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
}

/**
 * OATDA Error Structure
 */
export interface OatdaError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Chat Completion Parameters
 */
export interface ChatCompletionParams {
  /** Model identifier (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet") */
  model: string;
  /** Conversation messages */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /** Sampling temperature (0-2, lower = more focused) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Enable streaming response */
  stream?: boolean;
}

/**
 * Vision Analysis Parameters
 */
export interface VisionParams {
  /** Model identifier (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet") */
  model: string;
  /** Analysis prompt/question */
  prompt: string;
  /** Image URL or base64 data URI */
  imageUrl: string;
}

/**
 * Image Generation Parameters
 */
export interface ImageGenerationParams {
  /** Model identifier (e.g., "openai/dall-e-3", "google/imagen-4.0-generate-001") */
  model: string;
  /** Image generation prompt (1-4000 chars) */
  prompt: string;
  /** Image size (e.g., "1024x1024", "1792x1024") */
  size?: string;
  /** Image quality */
  quality?: 'standard' | 'hd' | 'auto' | 'low' | 'medium' | 'high';
  /** Number of images (1-10) */
  n?: number;
  /** Aspect ratio (for Google Imagen) */
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
}

/**
 * Image Generation Response
 */
export interface ImageGenerationResponse {
  /** Generated image URLs */
  urls: string[];
  /** Revised prompt (if applicable) */
  revisedPrompt?: string;
}

/**
 * Video Generation Parameters
 */
export interface VideoGenerationParams {
  /** Model identifier (e.g., "minimax/T2V-01", "google/veo-3.0-generate-preview") */
  model: string;
  /** Video generation prompt (1-4000 chars) */
  prompt: string;
  /** Video duration in seconds (1-60) */
  duration?: number;
  /** Resolution (e.g., "720P", "1080P", "1280x720") */
  resolution?: string;
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Negative prompt */
  negativePrompt?: string;
  /** Person generation control */
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
}

/**
 * Video Generation Response
 */
export interface VideoGenerationResponse {
  /** Task ID for polling */
  taskId: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
}

/**
 * Video Status Response
 */
export interface VideoStatusResponse {
  /** Task ID */
  taskId: string;
  /** Status: pending, processing, completed, failed */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Video URL (when completed) */
  videoUrl?: string;
  /** Error message (when failed) */
  errorMessage?: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Creation timestamp */
  createdAt: string;
  /** Completion timestamp (when completed) */
  completedAt?: string;
}

/**
 * Model List Filters
 */
export interface ModelFilters {
  /** Filter by type: all, chat, image, video */
  type?: 'all' | 'chat' | 'image' | 'video';
  /** Filter by provider name */
  provider?: string;
}

/**
 * Model Information
 */
export interface ModelInfo {
  /** Model ID (provider/model_name) */
  id: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
  /** Display name */
  displayName: string;
}

/**
 * Models List Response
 */
export interface ModelsListResponse {
  /** Total models matching filter */
  total: number;
  /** Applied filters */
  filter: {
    type: string;
    provider: string | null;
  };
  /** Chat models */
  chatModels?: ModelInfo[];
  /** Image models */
  imageModels?: ModelInfo[];
  /** Video models */
  videoModels?: ModelInfo[];
}

/**
 * OATDA API Client
 */
export class OatdaClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private userAgent: string;

  constructor(config: OatdaClientConfig) {
    this.baseUrl = config.baseUrl || 'https://oatda.com';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 120000;
    this.userAgent = config.userAgent || 'OATDA-Skills/1.0.0';
  }

  /**
   * Make an authenticated request to the OATDA API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<OatdaResponse<T>> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': this.userAgent,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'HTTP_ERROR',
            message: data.error?.message || data.message || response.statusText,
            details: data.error?.details,
          },
        };
      }

      return {
        success: true,
        data: data.data ?? data,
        usage: data.usage,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: `Request timeout after ${this.timeout}ms`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown network error',
          details: error,
        },
      };
    }
  }

  /**
   * Chat completion - generate text using LLM providers
   */
  async chatCompletion(params: ChatCompletionParams): Promise<OatdaResponse<string>> {
    const [provider, modelName] = params.model.split('/');

    return this.request<string>('/llm', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        messages: params.messages,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        stream: params.stream ?? false,
      }),
    });
  }

  /**
   * Vision analysis - analyze images with vision models
   */
  async visionAnalysis(params: VisionParams): Promise<OatdaResponse<string>> {
    const [provider, modelName] = params.model.split('/');

    return this.request<string>('/llm/vision', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt: params.prompt,
        imageUrl: params.imageUrl,
      }),
    });
  }

  /**
   * Image generation - create images using AI models
   */
  async generateImage(params: ImageGenerationParams): Promise<OatdaResponse<ImageGenerationResponse>> {
    const [provider, modelName] = params.model.split('/');

    const response = await this.request<{ url?: string; all_images?: Array<{ url: string }>; revised_prompt?: string }>('/llm/image', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt: params.prompt,
        size: params.size,
        quality: params.quality,
        n: params.n ?? 1,
        aspectRatio: params.aspectRatio,
        responseFormat: 'url',
      }),
    });

    if (!response.success || !response.data) {
      return response as OatdaResponse<ImageGenerationResponse>;
    }

    const data = response.data;
    const urls = data.all_images?.map((img) => img.url) || (data.url ? [data.url] : []);

    return {
      success: true,
      data: {
        urls,
        revisedPrompt: data.revised_prompt,
      },
    };
  }

  /**
   * Video generation - create videos using AI models (async)
   */
  async generateVideo(params: VideoGenerationParams): Promise<OatdaResponse<VideoGenerationResponse>> {
    const [provider, modelName] = params.model.split('/');

    return this.request<VideoGenerationResponse>('/llm/video', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        model: modelName,
        prompt: params.prompt,
        duration: params.duration,
        resolution: params.resolution,
        aspectRatio: params.aspectRatio,
        negativePrompt: params.negativePrompt,
        personGeneration: params.personGeneration,
      }),
    });
  }

  /**
   * Video status - check async video generation status
   */
  async getVideoStatus(taskId: string): Promise<OatdaResponse<VideoStatusResponse>> {
    return this.request<VideoStatusResponse>(`/llm/video-status/${taskId}`, {
      method: 'GET',
    });
  }

  /**
   * List models - get available models with filtering
   */
  async listModels(filters?: ModelFilters): Promise<OatdaResponse<ModelsListResponse>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.provider) params.append('provider', filters.provider);

    const queryString = params.toString();
    const endpoint = `/models${queryString ? `?${queryString}` : ''}`;

    return this.request<ModelsListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<OatdaResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    });
  }
}
