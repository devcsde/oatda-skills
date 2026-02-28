---
name: oatda-vision-analysis
description: Analyze images using vision-capable AI models through OATDA's unified API (OpenAI GPT-4o, Anthropic Claude, Google Gemini)
license: Apache-2.0
---

# OATDA Vision Analysis

Analyze images using vision-capable AI models through OATDA's unified interface. Supports URL images and base64-encoded images.

## Supported Vision Models

- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro

## Setup

1. Install this skill
2. Set your OATDA API key: `export OATDA_API_KEY=your_key_here`
3. Use the skill in your prompts

## Configuration

**Environment Variable** (quickest):
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

**Secure the config file**:
```bash
chmod 600 ~/.oatda/credentials.json
```

## Usage

Invoke this skill when:
- You need to analyze or describe an image
- You want to extract text (OCR) from an image
- You need to understand diagrams, charts, or screenshots
- You want to compare visual content

### Examples

```
> Analyze this image and describe what you see: https://example.com/photo.jpg
```

```
> What text is in this screenshot? Use openai/gpt-4o for the analysis: https://example.com/screenshot.png
```

```
> Describe the architecture diagram: https://example.com/diagram.png
```

### Model Selection

| Provider | Model ID | Best For |
|----------|----------|----------|
| OpenAI | `openai/gpt-4o` | General vision, high accuracy |
| OpenAI | `openai/gpt-4o-mini` | Fast, cost-effective |
| Anthropic | `anthropic/claude-3-5-sonnet` | Detailed analysis |
| Google | `google/gemini-2.0-flash` | Speed, cost |
| Google | `google/gemini-1.5-pro` | Long context |

## Parameters

- **model**: Vision-capable model identifier (e.g., "openai/gpt-4o")
- **prompt**: Analysis question/instruction
- **imageUrl**: Image URL (HTTPS) or base64 data URI
- **imageDetail**: Detail level: "low", "high", or "auto" (default: "auto")
- **temperature**: Sampling temperature (0-2)
- **maxTokens**: Maximum tokens for the analysis response

## Image Input Formats

- **HTTPS URL**: `https://example.com/image.jpg`
- **Base64 Data URI**: `data:image/png;base64,iVBORw0KGgo...`

## Security

- Only HTTPS URLs are accepted (no HTTP, no local files)
- Internal/private IPs are blocked (localhost, 169.254.x.x, etc.)
- Server-side SSRF protection is also enforced

## Cost Tracking

The skill tracks:
- Prompt tokens (including image tokens)
- Completion tokens
- Total cost in USD

## Troubleshooting

**"Image URL must use HTTPS"**
- Ensure your image URL starts with `https://`
- For local images, convert to base64 first

**"Model is not vision-capable"**
- Not all models support vision. Use GPT-4o, Claude 3.5, or Gemini.
- Check with `oatda-list-models` skill

**"No API key found"**
- Set `OATDA_API_KEY` or create `~/.oatda/credentials.json`

## Related Skills

- `oatda-text-completion` - Text generation
- `oatda-generate-image` - Image generation
- `oatda-list-models` - List available models
