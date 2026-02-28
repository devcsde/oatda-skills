---
name: oatda-generate-image
description: Generate images using AI models through OATDA's unified API (DALL-E 3, Google Imagen, MiniMax, Qwen, xAI)
license: Apache-2.0
---

# OATDA Image Generation

Generate images using AI models through OATDA's unified interface. Supports multiple providers with a single API.

## Supported Image Models

- **OpenAI**: DALL-E 3, GPT-Image-1
- **Google**: Imagen 4.0
- **MiniMax**: MiniMax Image
- **Alibaba**: Qwen Image
- **xAI**: Grok Image

## Setup

1. Install this skill
2. Set your OATDA API key: `export OATDA_API_KEY=your_key_here`
3. Use the skill in your prompts

## Configuration

**Environment Variable**:
```bash
export OATDA_API_KEY=your_api_key_here
```

**Config File** (recommended):
```json
// ~/.oatda/credentials.json
{
  "version": 1,
  "defaultProfile": "default",
  "profiles": {
    "default": {
      "name": "default",
      "apiKey": "your_api_key_here",
      "createdAt": 1234567890,
      "lastUsed": 1234567890
    }
  }
}
```

```bash
chmod 600 ~/.oatda/credentials.json
```

## Usage

Invoke this skill when:
- You need to generate images from text descriptions
- You want AI-created artwork, illustrations, or designs
- You need product mockups or concept art
- You want to compare image outputs from different providers

### Examples

```
> Generate an image of a cyberpunk city at night using DALL-E 3
```

```
> Create a watercolor painting of a mountain landscape using Google Imagen
```

```
> Generate 3 logo concepts for a coffee shop called "Bean There"
```

### Model Selection

| Provider | Model ID | Best For |
|----------|----------|----------|
| OpenAI | `openai/dall-e-3` | High quality, prompt following |
| OpenAI | `openai/gpt-image-1` | Latest OpenAI image model |
| Google | `google/imagen-4.0-generate-001` | Photorealistic images |

## Parameters

- **model**: Image model identifier (e.g., "openai/dall-e-3")
- **prompt**: Image description (1-4000 characters)
- **size**: Image dimensions (e.g., "1024x1024", "1792x1024")
- **quality**: "standard", "hd", "auto", "low", "medium", "high"
- **n**: Number of images to generate (1-10)
- **aspectRatio**: "1:1", "16:9", "9:16", "3:2", "2:3", etc.
- **style**: "vivid" (dramatic) or "natural" (realistic)
- **background**: "auto", "transparent", or "opaque"
- **outputFormat**: "png", "jpeg", or "webp"

## Output

Returns:
- **urls**: Array of generated image URLs
- **revisedPrompt**: The expanded prompt used by the model (if applicable)
- **cost**: Generation cost in USD

## Cost Tracking

Image generation costs vary by model and quality:
- DALL-E 3 Standard: ~$0.04 per image
- DALL-E 3 HD: ~$0.08 per image
- Imagen: varies by resolution

## Troubleshooting

**"Prompt exceeds maximum length"**
- Keep prompts under 4000 characters

**"No API key found"**
- Set `OATDA_API_KEY` or create `~/.oatda/credentials.json`

**"Content policy violation"**
- The prompt may contain restricted content. Adjust your description.

## Related Skills

- `oatda-text-completion` - Generate text descriptions for image prompts
- `oatda-vision-analysis` - Analyze generated images
- `oatda-list-models` - List available image models
