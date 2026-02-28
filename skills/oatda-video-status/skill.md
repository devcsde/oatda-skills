---
name: oatda-video-status
description: Check the status of async video generation tasks from OATDA's video generation API
license: Apache-2.0
---

# OATDA Video Status

Check the status of asynchronous video generation tasks. This is the companion skill to `oatda-generate-video`.

## Setup

1. Install this skill
2. Set your OATDA API key: `export OATDA_API_KEY=your_key_here`

## Usage

Invoke this skill when:
- You need to check if a video has finished generating
- You want to retrieve the video URL after generation
- You submitted a video generation request and need the result

### Examples

```
> Check the video generation status for task minimax-T2V01-abc123
```

```
> Is my video ready? Task ID: google-veo3-xyz789
```

### Workflow

1. Generate a video with `oatda-generate-video` → receive a task ID
2. Wait a moment (videos take 30s to several minutes)
3. Check status with this skill using the task ID
4. If "processing", wait and check again
5. If "completed", the video URL will be in the response

## Task Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Task queued, not yet started |
| `processing` | Video is being generated |
| `completed` | Video ready — URL included in response |
| `failed` | Generation failed — error message included |

## Output

Returns:
- **taskId**: The task identifier
- **status**: Current status
- **videoUrl**: Video download URL (when completed)
- **provider**: Provider name
- **model**: Model used
- **costs**: Generation cost (when completed)
- **errorMessage**: Error details (when failed)

## Troubleshooting

**"Task not found"**
- Verify the task ID is correct
- Tasks may expire after a period — regenerate if needed

**Status stuck on "processing"**
- Video generation can take 30s-5min
- Try checking again after a minute

**"No API key found"**
- Set `OATDA_API_KEY` or create `~/.oatda/credentials.json`

## Related Skills

- `oatda-generate-video` - Start video generation (required companion)
- `oatda-list-models` - List available video models
