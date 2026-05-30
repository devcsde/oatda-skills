---
name: oatda-generate-speech
description: Use when the user wants to generate speech/audio from text using OATDA's unified audio API. MCP generate_speech returns MCP audio content (client saves/plays; no server storage). HTTP /api/v1/llm/speech returns a file via curl --output. Supports OpenAI TTS, xAI grok-tts, voiceovers, and accessibility audio.
---

# OATDA Speech Generation

Generate spoken audio from text through OATDA's unified audio API.

## When to Use

Use this skill when the user wants to:
- Convert text to speech or audio
- Create voiceovers, announcements, narration, or accessibility audio
- Use TTS models such as OpenAI `tts-1` through OATDA
- Use the OATDA `generate_speech` capability

## HTTP vs MCP (read this first)

| Path | Response | Use when |
|------|----------|----------|
| **MCP** `generate_speech` | **MCP `audio` content block** (base64 in protocol; client saves/plays) + metadata in `structuredContent` | Already connected to OATDA MCP (Cursor, etc.) — **no OATDA file storage** |
| **HTTP** `POST /api/v1/llm/speech` | Raw audio bytes (`Content-Disposition: attachment`) | Shell/scripts: `curl --output speech.mp3` |

**Upstream providers (OpenAI TTS, xAI Grok TTS) do not return a hosted download URL** for speech. xAI returns raw bytes (`curl … --output hello.mp3` in [their docs](https://docs.x.ai/docs/guides/voice)). Unlike `grok-imagine-image`, there is no provider CDN link for TTS.

**MCP agents:** After `generate_speech`, use the **attached audio content** from the tool result (MCP spec `AudioContent`). Do not tell the user to “decode base64 manually” — save or play via the MCP client. Metadata (`format`, `duration_seconds`, `costs`) is in `structuredContent` without duplicating the audio blob.

**Shell/scripts:** Prefer HTTP with `--output` (see step 4).

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

Map common aliases:

| User says | Provider | Model |
|-----------|----------|-------|
| tts, tts-1, openai tts (default) | openai | tts-1 |
| tts hd, tts-1-hd | openai | tts-1-hd |
| gpt tts, gpt-4o mini tts | openai | gpt-4o-mini-tts |
| grok tts, xai tts, grok-tts | xai | grok-tts |

**Default**: `openai` / `tts-1` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/tts-1` or `xai/grok-tts`), split on `/` to get separate `provider` and `model` values for the JSON body.

**OpenAI voices** (parameter `voice`): `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`. Default `alloy`.

**xAI Grok TTS** (same `voice` field; OATDA maps to xAI `voice_id`): e.g. `eve`, `ara`, `rex`, `sal`, `una`, `leo`. Default `eve`. Supports `language` (e.g. `en`, `de`, or `auto`). Formats include `mp3`, `wav`, `pcm`, `mulaw`, `alaw`. **Do not send `speed`** to xAI — it is ignored/filtered. Max input **15 000** characters for `grok-tts`.

### 3. Optional: discover available audio models

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

Use `supported_params` to confirm model-specific options before sending optional fields.

### 4. Make the HTTP API call (preferred)

The speech endpoint returns **binary audio**, not JSON and **not a URL**. Always save with `--output` (same pattern as xAI’s official TTS examples).

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

1. Call with `model` (e.g. `xai/grok-tts`, `openai/tts-1`), `text`, optional `voice`, `response_format`.
2. The tool result includes an **`audio` content block** (`mimeType` + `data`) per the MCP spec — use your client to save or play it (e.g. write `speech.mp3` in the workspace).
3. Use `structuredContent` for billing/metadata only (`format`, `duration_seconds`, `costs`) — not for the audio bytes.

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
    "model": "tts-1",
    "input": "Welcome to OATDA, one API to direct all.",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.0
  }' \
  --output speech.mp3
```

## Tips

- The endpoint is `/api/v1/llm/speech`.
- Use `input`, not `prompt`, for text-to-speech requests.
- **HTTP:** response body = audio bytes; always use `curl --output <file>`. **Not** a JSON URL.
- **MCP:** returns spec **`audio` content** in the tool result; OATDA does not store speech files on disk.
- TTS is **not** like image generation: `grok-imagine-image` may return an HTTPS URL; `grok-tts` does not.
- For model discovery, use `/api/v1/llm/models?type=audio` or MCP `list_models` with `type="audio"`.
- Keep text under 15000 characters (stricter limits may apply per model).
- NEVER expose the full API key in output.
- MCP tool name: `generate_speech` (audio content block, no server-side artifact storage).
- Related skills: `/oatda:oatda-list-models`, `/oatda:oatda-transcribe-audio`, `/oatda:oatda-translate-audio`.
