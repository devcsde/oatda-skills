---
name: "oatda-video-ad-creator"
description: "Create OATDA video ads (Remotion + TTS + AI video clips). Triggers on \"create video\", \"make ad\", \"Werbevideo\", \"promo video\", \"video ad\"."
---

# OATDA Video Ad Creator (Hybrid Pipeline v2)

Creates branded video ads using OATDA's own APIs (TTS + AI video), Remotion (React motion graphics), and ffmpeg. End-to-end dogfooding: voice via OATDA TTS, AI clips via OATDA video API, product screenshots via headless Chrome.

## Scene Types (Baukasten)

| Scene | Visual | Use for |
|-------|--------|---------|
| `HookScene` | AI-generated video (OffthreadVideo) + Remotion text overlay | Opener, 3–5s |
| `ScreenshotScene` | Real product screenshot, slow zoom + gradient + text | Feature proof |
| `CodeScene` | Two terminal/editor cards, line-by-line reveal | API/SDK claims |
| `OutroScene` | Logo + URL + tagline + CTA button | Closer |

## Production Workflow (validated 2026-08-22)

1. **Script first.** Write VO sentences (short, punchy). Calibrate: onyx @ speed 1.0 ≈ 36 words ≈ 21s; speed 1.2 ≈ 17s. Target: VO duration + 0.7s gaps ≤ limit.
2. **AI hook clip** (seedance-1-5-pro):
   - Draft first (480p, ~40% cheaper) → verify via frame extraction + image model review
   - Final: `POST /api/v1/llm/generate-video` via curl (NOT MCP tool — see pitfalls), ~100–120s, `provider` field REQUIRED
   - model_params: `{"ratio":"16:9","resolution":"1080p","watermark":false,"generate_audio":false,"draft":false}`
   - Prompt rule: motion only, NO text/logos in AI clip — text comes as Remotion overlay
3. **TTS voiceover**: generate_speech per sentence → **download IMMEDIATELY** (URLs expire ~8 min) → concat with 0.7s gaps + 0.3s lead + 0.5s tail (`ffmpeg -f concat`, paths relative to the .txt!) → SoX master chain → MP3 256k
4. **Music mix**: voice + corporate track @ 0.28 volume, `amix normalize=0`, fade out last 1.5s
5. **Screenshots**: `google-chrome --headless --virtual-time-budget=10000` (client-rendered pages need it). Auth-walled pages → build CodeScene mock instead, verify real API paths from repo first
6. **Remotion render**: `npx remotion render src/index.ts oatda-ad-2026 out/raw.mp4` (~2 min)
7. **Mux**: `ffmpeg -i raw.mp4 -i mixed.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k` — never `-shortest`
8. **Verify**: ffprobe duration/fps + `volumedetect` (mean −17 to −20 dB) + extract 4 frames → image QA

## Timing Model (30fps)

VO start + ~0.5s pre-roll per scene; scene frames = round(sec × 30). Example 19.8s ad: Hook 0–136, Screenshot 136–298, Code 298–462, Outro 462–594.

## Known Pitfalls (all hit & solved 2026-08-22)

- **MCP `generate_video` times out** on 1080p full quality (~100s gen > tool timeout). Use direct curl with key from `/root/secrets/oatda.env` (source it, never log it). exec timeout ≥ 120s.
- **TTS download URLs expire ~8 min** (`{"error":"Unauthorized"}`). Generate→download must be coupled. Corrupt check: `file *.wav` must say WAV, not JSON.
- **ffmpeg concat paths** are relative to the concat.txt location, not CWD.
- **Headless screenshots of client-rendered pages** are empty without `--virtual-time-budget=10000`.
- Remotion `<Video>` for h264 MP4s → use `<OffthreadVideo>`.
- Remotion renders silent; audio always muxed separately.

## Cost per Ad

~$0.25 (Seedance 1080p 4s hook ≈ $0.23 + TTS ≈ $0.005). Draft iterations ≈ $0.09 each.

## Files (2026 layout)

- Composition: `~/content/remotion/src/Ads/OatdaAd2026.tsx` (scenes as components)
- Registration: `~/content/remotion/src/Root.tsx` (`oatda-ad-2026`)
- Assets: `~/content/remotion/public/{videos,images/screenshots}/`
- Audio: `~/content/audio/voiceover/` (vo-*.wav, vo-final.mp3, mixed.mp3)
- Output: `~/content/remotion/out/oatda-ad-2026-final.mp4`

## Stats freshness

Provider/model counts (14/245) are set in Root.tsx defaultProps — update per render, keep spoken VO with "+" floors ("over a dozen", "two hundred plus") so audio never lies when counts shift.
