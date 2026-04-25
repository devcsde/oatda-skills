---
name: oatda-translate-audio
description: Use when the user wants to translate foreign-language audio into English text using OATDA's unified audio API. Supports audio translation, Whisper-style translation, and the translate_audio MCP capability.
---

# OATDA Audio Translation

Translate audio into English text through OATDA's unified audio API.

## When to Use

Use this skill when the user wants to:
- Translate foreign-language audio into English text
- Convert French, German, Spanish, Italian, or other spoken audio to English
- Translate interviews, voice notes, meetings, podcasts, or recordings
- Use Whisper-style audio translation through OATDA
- Use the OATDA `translate_audio` capability

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

### 2. Determine the model

Map common aliases:

| User says | Provider | Model |
|-----------|----------|-------|
| whisper, whisper-1, openai whisper (default) | openai | whisper-1 |
| translate audio, audio translation | openai | whisper-1 |

**Default**: `openai` / `whisper-1` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/whisper-1`), split on `/` to get separate `provider` and `model` values.

### 3. Prepare the audio input

The endpoint supports:
- `multipart/form-data` with a local file upload
- JSON with a base64 data URL in `file`

Maximum audio file size is 25MB.

For local files, prefer multipart upload because it avoids manually building large JSON bodies.

### 4. Optional: discover available audio models

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

Use `supported_params` to confirm whether the model supports translation and optional fields.

### 5. Make the API call with multipart/form-data

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/translations" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -F "provider=<PROVIDER>" \
  -F "model=<MODEL>" \
  -F "file=@<AUDIO_FILE>" \
  -F "response_format=json"
```

Replace `<PROVIDER>`, `<MODEL>`, and `<AUDIO_FILE>` with actual values.

### 6. Alternative: JSON request with base64 data URL

```bash
AUDIO_DATA_URL="data:audio/mpeg;base64,$(base64 -w 0 audio.mp3)"

curl -s -X POST "https://oatda.com/api/v1/llm/translations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d "$(jq -n \
    --arg provider "<PROVIDER>" \
    --arg model "<MODEL>" \
    --arg file "$AUDIO_DATA_URL" \
    '{provider: $provider, model: $model, file: $file, response_format: "json"}')"
```

### 7. Optional parameters

- `prompt`: Optional hint for terminology, names, or translation style
- `response_format`: `json`, `text`, `srt`, `verbose_json`, or `vtt`
- `temperature`: 0 to 1
- `filename`: Optional filename for JSON uploads

### 8. Parse the response

The API returns JSON like:

```json
{
  "text": "The English translation...",
  "language": "fr",
  "duration": 42.5,
  "costs": {
    "inputCost": 0,
    "outputCost": 0.0001,
    "totalCost": 0.0001,
    "currency": "USD"
  },
  "metadata": {
    "provider": "openai",
    "model": "whisper-1",
    "latency": 1200
  }
}
```

Present the `text` field to the user. Mention that the output is English unless the user asked for another downstream translation step.

### 9. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 402 | Insufficient credits | Tell user to check balance |
| 400 | Bad request / model not supported | Check model format, file format, and use `/oatda:oatda-list-models` with `type=audio` |
| 413 | File too large | Keep audio under 25MB or split it |
| 429 | Rate limited or monthly cap | Wait briefly and retry once |

## Full Example

User asks: "Translate this French audio to English with Whisper"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/translations" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -F "provider=openai" \
  -F "model=whisper-1" \
  -F "file=@french-audio.mp3" \
  -F "response_format=json"
```

## Tips

- The endpoint is `/api/v1/llm/translations`.
- Translation output is English text.
- Prefer multipart upload for local files.
- Keep audio files under 25MB.
- Use `prompt` for names, acronyms, or domain-specific terminology.
- NEVER expose the full API key in output.
- Equivalent MCP tool name: `translate_audio`.
- Related skills: `/oatda:oatda-transcribe-audio`, `/oatda:oatda-generate-speech`, `/oatda:oatda-list-models`.
