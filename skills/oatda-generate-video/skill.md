---
name: oatda-generate-video
description: Generate videos using AI models through OATDA's unified API (MiniMax, Google Veo, Alibaba Wan, ZAI)
license: Apache-2.0
---

# OATDA Video Generation

Generate videos using AI models through OATDA's unified interface. Video generation is asynchronous — you'll receive a task ID to check status with the `oatda-video-status` skill.

## Supported Video Models

- **MiniMax**: T2V-01 (text-to-video)
- **Google**: Veo 3.0 (text-to-video)
- **Alibaba**: Wan (text-to-video)
- **ZAI**: Video generation models
- **OpenAI**: Sora

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
- You need AI-generated video content
- You want text-to-video generation
- You need video clips for presentations or content

### Examples

```
> Generate a 5-second video of ocean waves at sunset using Google Veo
```

```
> Create a video of a cat playing with yarn using MiniMax T2V-01
```

```
> Make a 10-second cinematic video of a futuristic city
```

### Workflow

1. **Generate**: Submit a video generation request → receive a task ID
2. **Poll**: Use `oatda-video-status` skill to check when the video is ready
3. **Download**: Get the video URL from the status response

### Model Selection

| Provider | Model ID | Best For |
|----------|----------|----------|
| MiniMax | `minimax/T2V-01` | General video, good quality |
| Google | `google/veo-3.0-generate-preview` | High fidelity |
| Alibaba | `alibaba/wan-t2v` | Cost-effective |

## Parameters

- **model**: Video model identifier (e.g., "minimax/T2V-01")
- **prompt**: Video description (1-4000 characters)
- **duration**: Video duration in seconds
- **resolution**: "720P", "1080P"
- **aspectRatio**: "16:9", "9:16", "1:1"
- **quality**: Quality setting (model-dependent)
- **style**: Style setting (model-dependent)

## Output

Returns:
- **taskId**: Unique task ID for status polling
- **status**: Initial status (usually "pending")
- **provider**: Provider name
- **model**: Model name
- **pollUrl**: URL to check status

## Important Notes

- Video generation is **asynchronous** — it can take 30 seconds to several minutes
- Use the `oatda-video-status` skill to check when your video is ready
- Video URLs are temporary — download promptly after generation

## Troubleshooting

**"No API key found"**
- Set `OATDA_API_KEY` or create `~/.oatda/credentials.json`

**Video takes too long**
- Video generation typically takes 30s-5min depending on model and duration
- Check status with `oatda-video-status`

**"Content policy violation"**
- The prompt may contain restricted content

## Related Skills

- `oatda-video-status` - Check video generation status (required companion)
- `oatda-text-completion` - Generate video prompts
- `oatda-list-models` - List available video models
