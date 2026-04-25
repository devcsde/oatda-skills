---
name: oatda-list-models
description: Use when the user wants to list available AI models from OATDA's 10+ providers. Filter by type (chat, image, video, audio) or by provider name, including speech, transcription, and translation models.
---

# OATDA List Models

List all available AI models from OATDA's providers with optional filtering.

## When to Use

Use this skill when the user wants to:
- See what models are available through OATDA
- Find the right model for a specific task (chat, image, video, audio)
- Know which providers are supported
- Filter models by type or provider

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

### 2. Determine filters

Parse the user's request for optional filters:
- **type**: `chat`, `image`, `video`, or `audio` (omit for all types)
- **provider**: Provider name like `openai`, `anthropic`, `google`, etc.

### 3. Make the API call

**List all models** (no filters):

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Filter by type**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=chat" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**List audio models**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Filter by provider**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

**Combine filters**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=image&provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

### 4. Parse the response

The API returns an OpenAI-compatible format. Image, video, and audio models include `supported_params` showing model-specific parameters:

```json
{
  "total": 42,
  "filter": {
    "type": "all",
    "provider": null
  },
  "chatModels": [
    {"id": "openai/gpt-4o", "provider": "openai", "model": "gpt-4o", "displayName": "GPT-4o"},
    {"id": "anthropic/claude-3-5-sonnet", "provider": "anthropic", "model": "claude-3-5-sonnet", "displayName": "Claude 3.5 Sonnet"}
  ],
  "imageModels": [
    {
      "id": "openai/dall-e-3",
      "provider": "openai",
      "model": "dall-e-3",
      "displayName": "DALL-E 3",
      "supported_params": {
        "style": {"type": "string", "values": ["vivid", "natural"], "default": "vivid"},
        "quality": {"type": "string", "values": ["standard", "hd"], "default": "standard"}
      }
    }
  ],
  "videoModels": [
    {
      "id": "bytedance/seedance-1-5-pro-251215",
      "provider": "bytedance",
      "model": "seedance-1-5-pro-251215",
      "displayName": "Seedance 1.5 Pro",
      "supported_params": {
        "ratio": {"type": "string", "values": ["16:9", "9:16", "1:1"], "default": "16:9"},
        "duration": {"type": "string", "values": ["5", "10"], "default": "5"},
        "generate_audio": {"type": "boolean", "default": false, "optional": true},
        "camera_fixed": {"type": "boolean", "default": false, "optional": true},
        "first_frame_image": {"type": "file", "accept": "image/*", "optional": true, "description": "Starting frame image URL"},
        "last_frame_image": {"type": "file", "accept": "image/*", "optional": true, "description": "Ending frame image URL"}
      }
    }
  ],
  "audio_models": [
    {
      "id": "openai/tts-1",
      "provider": "openai",
      "model_name": "tts-1",
      "display_name": "OpenAI TTS 1",
      "supported_params": {
        "audio_modes": ["tts"],
        "voice": {"type": "string", "values": ["alloy", "nova", "shimmer"]},
        "response_format": {"type": "string", "values": ["mp3", "wav", "opus"]}
      }
    },
    {
      "id": "openai/whisper-1",
      "provider": "openai",
      "model_name": "whisper-1",
      "display_name": "OpenAI Whisper",
      "supported_params": {
        "audio_modes": ["transcription", "translation"],
        "response_format": {"type": "string", "values": ["json", "text", "srt", "verbose_json", "vtt"]}
      }
    }
  ]
}
```

### 5. Understanding supported_params

Image, video, and audio models include a `supported_params` object that describes model-specific parameters. Use this to discover what parameters each model accepts before generation, transcription, or translation.

**Structure of each parameter**:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Parameter type: `string`, `number`, `boolean`, or `file` |
| `values` | array | Allowed values (for enum-type strings) |
| `default` | any | Default value if not specified |
| `description` | string | Human-readable description |
| `optional` | boolean | Whether the parameter is optional |
| `accept` | string | For `file` types: accepted MIME types (e.g., `"image/*"`) |
| `min` / `max` | number | Range constraints for numeric values |

**File-type parameters**: Parameters with `type: "file"` require a publicly accessible URL (https://...), not local file paths. Examples include `mask`, `first_frame_image`, `last_frame_image`.

**Audio modes**: Audio models may support one or more modes such as `tts`, `transcription`, and `translation`. Use this to choose the correct skill:
- `tts` → `/oatda:oatda-generate-speech`
- `transcription` → `/oatda:oatda-transcribe-audio`
- `translation` → `/oatda:oatda-translate-audio`

**Example - Discovering image model params**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=image&provider=bytedance" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.image_models[].supported_params'
```

This reveals that Bytedance Seedream supports: `size`, `watermark`, `seed`, `negative_prompt`, etc.

**Example - Discovering video model params**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=video&provider=bytedance" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.video_models[].supported_params'
```

This reveals that Seedance supports: `ratio`, `duration`, `generate_audio`, `camera_fixed`, `first_frame_image`, `last_frame_image`, etc.

**Example - Discovering audio model params**:

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio&provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

This reveals whether a model supports speech generation, transcription, translation, and which voices or response formats are available.

### 6. Present results

Format the models in a readable way, organized by category:

**Chat Models** (N total):
- `openai/gpt-4o` — GPT-4o
- `anthropic/claude-3-5-sonnet` — Claude 3.5 Sonnet
- ...

**Image Models** (N total):
- `openai/dall-e-3` — DALL-E 3
- ...

**Video Models** (N total):
- `minimax/T2V-01` — MiniMax T2V-01
- ...

**Audio Models** (N total):
- `openai/tts-1` — OpenAI TTS 1
- `openai/whisper-1` — OpenAI Whisper
- ...

If the response format differs (e.g., flat `data` array with `id` and `object` fields), adapt accordingly and group by provider or capability.

### 7. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 429 | Rate limited | Wait and retry |

## Full Example

User asks: "What OpenAI models are available?"

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?provider=openai" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

User asks: "Show me all image generation models"

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=image" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

User asks: "Show me all audio models"

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY"
```

User asks: "What parameters does Seedance video model support?"

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=video&provider=bytedance" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.video_models[] | select(.model | contains("seedance")) | .supported_params'
```

This returns all supported parameters for Seedance, including `ratio`, `duration`, `generate_audio`, `camera_fixed`, `first_frame_image`, `last_frame_image`, etc.

## Tips

- This is a GET request with query parameters, not POST
- Use this skill to help users find the right model for other OATDA skills
- The `id` field (e.g., `openai/gpt-4o`) is the model identifier used in other skills
- **Use `supported_params` to discover model-specific parameters before generating images/videos or using audio models**
- For file-type params (mask, reference images), provide publicly accessible URLs
- NEVER expose the full API key in output
- Related skills: `/oatda:oatda-text-completion`, `/oatda:oatda-generate-image`, `/oatda:oatda-generate-video`, `/oatda:oatda-generate-speech`, `/oatda:oatda-transcribe-audio`, `/oatda:oatda-translate-audio`, `/oatda:oatda-vision-analysis`
