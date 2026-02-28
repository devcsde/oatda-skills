---
name: oatda-list-models
description: List available AI models from OATDA's 13+ providers, filtered by type (chat, image, video) or provider
license: Apache-2.0
---

# OATDA List Models

List all available AI models from OATDA's 13+ providers. Filter by type (chat, image, video) or by provider name.

## Setup

1. Install this skill
2. Set your OATDA API key: `export OATDA_API_KEY=your_key_here`

## Usage

Invoke this skill when:
- You want to see all available models
- You need to find the right model for a task
- You want to know which providers are available
- You want to filter models by type or provider

### Examples

```
> List all available OATDA models
```

```
> Show me all image generation models
```

```
> What OpenAI models are available?
```

```
> List all video models
```

## Filters

- **type**: Filter by model type
  - `all` (default) — show all models
  - `chat` — text/chat completion models
  - `image` — image generation models
  - `video` — video generation models
- **provider**: Filter by provider name (e.g., "openai", "anthropic", "google")

## Output

Returns categorized model lists:
- **chatModels**: Text/chat models with provider and display name
- **imageModels**: Image generation models
- **videoModels**: Video generation models
- **total**: Total number of matching models

Each model includes:
- **id**: Full model identifier (e.g., "openai/gpt-4o")
- **provider**: Provider name
- **model**: Model name
- **displayName**: Human-readable name

## Troubleshooting

**"No API key found"**
- Set `OATDA_API_KEY` or create `~/.oatda/credentials.json`

**Empty results**
- Check your filter parameters
- Some providers may have limited model types

## Related Skills

- `oatda-text-completion` - Use chat models
- `oatda-generate-image` - Use image models
- `oatda-generate-video` - Use video models
- `oatda-vision-analysis` - Use vision-capable models
