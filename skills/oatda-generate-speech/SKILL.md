---
name: oatda-generate-speech
description: Use when the user wants to generate speech/audio from text using OATDA's unified audio API. Supports text-to-speech (TTS), voiceovers, accessibility audio, and the generate_speech MCP capability with models such as OpenAI TTS.
---

# OATDA Speech Generation

Generate spoken audio from text through OATDA's unified audio API.

## When to Use

Use this skill when the user wants to:
- Convert text to speech or audio
- Create voiceovers, announcements, narration, or accessibility audio
- Use TTS models such as OpenAI `tts-1` through OATDA
- Use the OATDA `generate_speech` capability

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

**Default**: `openai` / `tts-1` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/tts-1`), split on `/` to get separate `provider` and `model` values.

Common OpenAI voices include `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, and `shimmer`. Use `alloy` if the user does not specify a voice.

### 3. Optional: discover available audio models

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

Use `supported_params` to confirm model-specific options before sending optional fields.

### 4. Make the API call

The speech endpoint returns **binary audio**, not JSON. Save the response to a file.

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

If the request succeeds, tell the user where the audio file was saved, e.g.:
> Speech generated successfully: `speech.mp3`

If you need to inspect the response headers, use `curl -D headers.txt` while still saving the body to an audio file.

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
- The response is an audio file; always save it with `--output`.
- For model discovery, use `/api/v1/llm/models?type=audio`.
- Keep text under 15000 characters.
- NEVER expose the full API key in output.
- Equivalent MCP tool name: `generate_speech`.
- Related skills: `/oatda:oatda-list-models`, `/oatda:oatda-transcribe-audio`, `/oatda:oatda-translate-audio`.
