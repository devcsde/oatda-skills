---
name: oatda-generate-image
description: Use when the user wants to generate images using AI models through OATDA's unified API. Supports DALL-E 3, GPT-Image-1, Google Imagen, MiniMax, Qwen, and xAI image models.
---

# OATDA Image Generation

Generate images from text descriptions using AI models through OATDA's unified API.

## When to Use

Use this skill when the user wants to:
- Generate images from text descriptions via OATDA
- Create AI artwork, illustrations, or designs
- Generate product mockups or concept art
- Use DALL-E, Imagen, or other image models through a single API

## Prerequisites

The user needs an OATDA API key. Check in this order:
1. `$OATDA_API_KEY` environment variable
2. `~/.oatda/credentials.json` config file

If neither exists, tell the user:
> You need an OATDA API key. Get one at https://oatda.com, then set it:
> `export OATDA_API_KEY=your_key_here`

## Step-by-Step Instructions

### 1. Resolve the API key

```bash
# Check env var first; if empty, auto-load from credentials file
if [[ -z "$OATDA_API_KEY" ]]; then
  export OATDA_API_KEY=$(cat ~/.oatda/credentials.json 2>/dev/null | jq -r '.profiles[.defaultProfile].apiKey' 2>/dev/null)
fi

# Verify key exists (show first 8 chars only)
echo "${OATDA_API_KEY:0:8}"
```

If the output is empty or `null`, stop and ask the user to configure their API key.

**IMPORTANT**:
- Never print the full API key. Only show the first 8 characters for verification.
- The key resolution script and subsequent `curl` commands **must run in the same shell session**. Each separate bash/terminal invocation starts with an isolated environment where previously exported variables are lost. Either run all commands in one session, or chain them (e.g., `export OATDA_API_KEY=... && curl ...`).

### 2. Determine the model

Map common aliases:

| User says | Provider | Model |
|-----------|----------|-------|
| dall-e, dall-e-3 (default) | openai | dall-e-3 |
| gpt-image | openai | gpt-image-1 |
| imagen | google | imagen-4.0-generate-001 |

**Default**: `openai` / `dall-e-3` if no model specified.

### 3. Make the API call

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "<PROVIDER>",
    "model": "<MODEL>",
    "prompt": "<IMAGE_DESCRIPTION>",
    "size": "1024x1024",
    "quality": "standard",
    "n": 1,
    "numberOfImages": 1,
    "aspectRatio": "1:1",
    "style": "vivid",
    "personGeneration": "allow_adult"
  }'
```

Replace `<PROVIDER>`, `<MODEL>`, and `<IMAGE_DESCRIPTION>` with actual values.

**CRITICAL**: The endpoint is `/api/v1/llm/generate-image` (NOT `/api/v1/llm/image` — that's vision analysis).

**Parameters**:
- `prompt`: Image description (1-4000 characters)
- `size`: Dimensions — `"1024x1024"`, `"1792x1024"`, `"1024x1792"`
- `quality`: `"standard"`, `"hd"`, `"auto"`, `"low"`, `"medium"`, `"high"`
- `n` and `numberOfImages`: Number of images (1-10), set both to the same value
- `aspectRatio`: `"1:1"`, `"16:9"`, `"9:16"`, `"3:2"`, `"2:3"`, `"4:3"`, `"3:4"`, etc.
- `style`: `"vivid"` (dramatic, hyper-real) or `"natural"` (realistic)
- `background`: `"auto"`, `"transparent"`, or `"opaque"`
- `outputFormat`: `"png"`, `"jpeg"`, or `"webp"`

### 4. Parse the response

```json
{
  "success": true,
  "url": "https://cdn.example.com/generated-image.png",
  "all_images": [
    {"url": "https://cdn.example.com/image-1.png"},
    {"url": "https://cdn.example.com/image-2.png"}
  ],
  "revised_prompt": "A detailed cyberpunk cityscape at night with neon lights..."
}
```

- Show the image URL(s) to the user (from `all_images` array, or `url` field if single image)
- If `revised_prompt` is present, mention how the model expanded the prompt

### 5. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 400 | Bad request / prompt too long | Keep prompt under 4000 chars |
| 429 | Rate limited | Wait 5 seconds and retry once |
| 400 with content_policy | Content policy violation | Ask user to adjust the description |

## Full Example

User asks: "Generate an image of a cyberpunk city at night using DALL-E 3"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/generate-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "openai",
    "model": "dall-e-3",
    "prompt": "A cyberpunk city at night with neon lights reflecting on wet streets",
    "size": "1024x1024",
    "quality": "hd",
    "n": 1,
    "numberOfImages": 1,
    "style": "vivid"
  }'
```

## Tips

- The endpoint is `/api/v1/llm/generate-image` — do NOT confuse with `/api/v1/llm/image` (that's vision)
- DALL-E 3 costs ~$0.04/image (standard), ~$0.08/image (HD)
- Set both `n` and `numberOfImages` to the same value for compatibility
- Image URLs may be temporary — recommend downloading promptly
- Maximum prompt length is 4000 characters
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-vision-analysis` for analyzing images, `/oatda:oatda-list-models` for available image models
