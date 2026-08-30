---
name: oatda-transcribe-audio
description: Use when the user wants to transcribe audio to text using OATDA's unified audio API. Supports speech-to-text (STT), meetings, podcasts, voice notes, Whisper-style transcription, and the transcribe_audio MCP capability.
---

# OATDA Audio Transcription

Transcribe audio files to text through OATDA's unified audio API.

## When to Use

Use this skill when the user wants to:
- Transcribe meetings, podcasts, interviews, or voice notes
- Convert speech audio to written text
- Create subtitles or timestamped transcripts
- Use Whisper-style speech-to-text models through OATDA
- Use the OATDA `transcribe_audio` capability

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
| transcription, speech to text, stt | openai | whisper-1 |

**Default**: `openai` / `whisper-1` if no model is specified.

If the user provides `provider/model` format directly (e.g., `openai/whisper-1`), split on `/` to get separate `provider` and `model` values.

### 3. Prepare the audio input

The endpoint supports:
- `multipart/form-data` with a local file upload
- JSON with a base64 data URL in `file`
- JSON with `file_base64` for providers that support direct base64 payloads

Maximum audio file size is 25MB.

For local files, prefer multipart upload because it avoids manually building large JSON bodies.

### 4. Optional: discover available audio models

```bash
curl -s -X GET "https://oatda.com/api/v1/llm/models?type=audio" \
  -H "Authorization: Bearer $OATDA_API_KEY" | jq '.audio_models[] | {id, supported_params}'
```

Use `supported_params` to confirm whether the model supports transcription and optional fields such as timestamps or diarization.

### 5. Make the API call with multipart/form-data

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/transcriptions" \
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

curl -s -X POST "https://oatda.com/api/v1/llm/transcriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -d "$(jq -n \
    --arg provider "<PROVIDER>" \
    --arg model "<MODEL>" \
    --arg file "$AUDIO_DATA_URL" \
    '{provider: $provider, model: $model, file: $file, response_format: "json"}')"
```

### 7. Optional parameters

- `language`: ISO-639-1 language code, e.g. `en`, `de`, `fr`
- `prompt`: Context for names, acronyms, or domain-specific terms
- `response_format`: `json`, `text`, `srt`, `verbose_json`, `vtt`, or `diarized_json`
- `temperature`: 0 to 1
- `timestamp_granularities`: `word` and/or `segment`
- `chunking_strategy`: `auto`
- `hotwords`: Provider-specific keyword hints
- `stream`: `true` for streaming transcription if supported

### 8. Parse the response

The API returns JSON like:

```json
{
  "text": "The transcribed text...",
  "language": "en",
  "duration": 42.5,
  "segments": [],
  "words": [],
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

Present the `text` field to the user. Include `segments`, `words`, or subtitles if the user requested a timestamped format.

### 9. Handle errors

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 401 | Invalid API key | Tell user to check their key |
| 402 | Insufficient credits | Tell user to check balance |
| 400 | Bad request / model not supported | Check model format, file format, and use `/oatda:oatda-list-models` with `type=audio` |
| 413 | File too large | Keep audio under 25MB or split it |
| 429 | Rate limited or monthly cap | Wait briefly and retry once |

## Full Example

User asks: "Transcribe this recording with Whisper"

```bash
curl -s -X POST "https://oatda.com/api/v1/llm/transcriptions" \
  -H "Authorization: Bearer $OATDA_API_KEY" \
  -F "provider=openai" \
  -F "model=whisper-1" \
  -F "file=@meeting.mp3" \
  -F "response_format=json"
```

## Tips

- The endpoint is `/api/v1/llm/transcriptions`.
- Prefer multipart upload for local files.
- Keep audio files under 25MB.
- Use `response_format=srt` or `vtt` when the user wants subtitles.
- Use `language` to improve recognition for known source-language audio.
- NEVER expose the full API key in output.
- Equivalent MCP tool name: `transcribe_audio`.
- Related skills: `/oatda:oatda-generate-speech`, `/oatda:oatda-translate-audio`, `/oatda:oatda-list-models`.
