---
name: oatda-generate-speech
description: Use when the user wants to generate speech/audio from text using OATDA's unified audio API. MCP generate_speech returns a short-lived signed AUDIO_URL (download with curl, no login). HTTP /api/v1/llm/speech returns a file via curl --output. Supports OpenAI TTS, xAI grok-tts, voiceovers, and accessibility audio.
---

# OATDA Speech Generation

Generate spoken audio from text through OATDA's unified audio API.

## When to Use

Use this skill when the user wants to:
- Convert text to speech or audio
- Create voiceovers, announcements, narration, or accessibility audio
- Use TTS models from OpenAI, xAI, Google and others through OATDA
- Use the OATDA `generate_speech` capability

## HTTP vs MCP (read this first)

| Path | Response | Use when |
|------|----------|----------|
| **MCP** `generate_speech` | Text with **`AUDIO_URL:`** (HMAC `?exp=&sig=`, ~1h TTL) + metadata in `structuredContent` (`download_url`, `format`, `duration_seconds`, `costs`) | Already connected to OATDA MCP (Cursor, etc.) |
| **HTTP** `POST /api/v1/llm/speech` | Raw audio bytes (`Content-Disposition: attachment`) | Shell/scripts: `curl --output speech.mp3` |

**Upstream providers (OpenAI TTS, xAI Grok TTS) do not return a hosted download URL** for speech. xAI returns raw bytes (`curl ... --output hello.mp3` in [their docs](https://docs.x.ai/docs/guides/voice)). OATDA MCP mirrors TTS into a short-lived signed download so editors can fetch without a browser session.

**MCP agents:** After `generate_speech`, extract `AUDIO_URL:` from the tool text (or `structuredContent.download_url`) and download with curl - **no login required**. Do **not** expect MCP `AudioContent` / base64 audio blocks (removed). URL expires in ~1 hour.

**Shell/scripts:** Prefer HTTP with `--output` (see step 4), or MCP signed URL + curl.

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
- The key resolution script and subsequent `curl` commands **must run in the same shell session**. Each separate bash/terminal invocation starts with an isolated environment where previously exported variables are lost. Either run all commands in one session, or chain them.

### 2. Determine the model and voice

> **⚠️ Model availability changes over time.** Always call `list_models` with `type="audio"` (or `/api/v1/llm/models?type=audio`) to verify the exact model ID, available voices, and supported parameters before generating speech.

If the user provides `provider/model` format directly (e.g. `openai/gpt-4o-mini-tts` or `xai/grok-tts`), split on `/` to get separate `provider` and `model` values for the JSON body.

Use `list_models` results to determine:
- Available voices (from `supported_params.voice.values`)
- Supported response formats
- Optional parameters like `language` or `instructions`
- Any per-model constraints

If the user does not specify a model, query `list_models` first and offer a choice from the currently available TTS models.

### 3. Optional: discover available audio models

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

Use `supported_params` to confirm model-specific options before sending optional fields.

### 4. Make the HTTP API call (preferred)

The speech endpoint returns **binary audio**, not JSON and **not a URL**. Always save with `--output` (same pattern as xAI's official TTS examples).

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "<PROVIDER>",
    "model": "<MODEL>",
    "input": "<TEXT_TO_SPEAK>",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.0
  }' \
  --output speech.mp3
```

Replace `<PROVIDER>`, `<MODEL>`, and `<TEXT_TO_SPEAK>` with actual values.

**Parameters**:
- `input`: Text to convert to speech, max 15000 characters
- `voice`: Voice name, e.g. `alloy`, `nova`, `shimmer`
- `response_format`: `mp3`, `opus`, `aac`, `flac`, `wav`, `pcm`, `mulaw`, or `alaw`
- `speed`: 0.25 to 4.0, default 1.0
- `instructions`: Optional style/tone instructions for supported models
- `language`: Optional language code for supported models

### 5. Present the result

If the request succeeds, tell the user the **absolute or workspace path** to the saved file, e.g.:
> Speech generated successfully: `speech.mp3` (binary MP3, ready to play)

If you need to inspect the response headers, use `curl -D headers.txt` while still saving the body to an audio file.

### MCP `generate_speech`

1. Call with `model` (verify exact ID via `list_models` with `type="audio"`), `text`, optional `voice`, `response_format`.
2. Tool result text contains `AUDIO_URL: https://.../api/v1/oneagent/generated/<uuid>?exp=...&sig=...` (also in `structuredContent.download_url`).
3. Download without login:

```bash
curl -fsSL -o speech.mp3 '<AUDIO_URL from tool result>'
```

4. Do **not** look for an MCP `audio` content block / base64 payload - that contract was removed.
5. URL is audio-only and expires in ~1 hour (Redis TTL). Image/video MCP delivery is unchanged (provider URLs).

### xAI example (HTTP)

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "xai",
    "model": "grok-tts",
    "input": "Hallo, das ist ein Test mit Grok TTS.",
    "voice": "eve",
    "language": "de",
    "response_format": "mp3"
  }' \
  --output grok-speech.mp3
```

### 6. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key at https://oatda.com/dashboard/api-keys |
| 402 | Insufficient credits | Tell user to check balance at https://oatda.com/dashboard/usage |
| 400 | Bad request / model not supported | Check model format and use `/oatda:oatda-list-models` with `type=audio` |
| 429 | Rate limited or monthly cap | Wait briefly and retry once, or ask user to check caps |
| 500 | Provider error | Show the error message if returned |

## Full Example

User asks: "Convert this text to speech with alloy voice using OpenAI TTS"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini-tts",
    "input": "Welcome to OATDA, one API to direct all.",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.0
  }' \
  --output speech.mp3
```

> **Note:** The model ID above is an example. Always verify the current model ID via `list_models` before use.

## Tips

- The endpoint is `/api/v1/llm/speech`.
- Use `input`, not `prompt`, for text-to-speech requests.
- **HTTP:** response body = audio bytes; always use `curl --output <file>`. **Not** a JSON URL.
- **MCP:** signed `AUDIO_URL` in tool text / `structuredContent.download_url`; download with curl (no session). Expires ~1h.
- TTS is **not** like image generation: `grok-imagine-image` may return an HTTPS URL; HTTP `grok-tts` returns raw bytes. MCP speech adds OATDA's short-lived signed mirror.
- For model discovery, use `/api/v1/llm/models?type=audio` or MCP `list_models` with `type="audio"`.
- Keep text under 15000 characters (stricter limits may apply per model).
- NEVER expose the full API key in output.
- MCP tool name: `generate_speech` (signed download URL, not AudioContent base64).
- Related skills: `/oatda:oatda-list-models`, `/oatda:oatda-transcribe-audio`, `/oatda:oatda-translate-audio`.
