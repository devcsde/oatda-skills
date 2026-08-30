---
name: "oatda-video-ad-creator"
description: "Create a branded video ad for the user's own product using OATDA APIs (TTS voiceover + AI video hook clip), Remotion, and ffmpeg. Triggers on \"create video\", \"make ad\", \"Werbevideo\", \"promo video\", \"video ad\"."
---

# OATDA Video Ad Creator

Build a short (15–30s) branded video ad for **the user's product** from start to finish: script → OATDA TTS voiceover → OATDA AI video hook clip → product screenshots → Remotion composition → ffmpeg mux → QA gate.

## Audience & Inputs

The user brings their **own brand** — logo, colors, fonts — plus product screenshots and the message they want to convey. Collect before starting:

- Brand kit: primary/accent colors (hex), logo file, preferred font
- Product screenshots or URLs to capture
- Key message: 3–4 short claims and one call to action (CTA)
- Target duration and aspect ratio (default 16:9, 1080p, ~20–25s)

The Remotion scaffold lives in this repo at `templates/video-ad-remotion/` — copy it into a local project folder (e.g. `~/video-ad/`) and work there.

## Scene Types

| Scene | Visual | Use for |
|-------|--------|---------|
| `HookScene` | AI-generated video clip (`OffthreadVideo`) + text overlay, or pure motion graphics | Opener, 3–5s |
| `ScreenshotScene` | Real product screenshot, slow zoom + gradient + text | Feature proof |
| `CodeScene` | Two terminal/editor cards, line-by-line reveal | API/SDK/technical claims |
| `OutroScene` | Logo + URL + tagline + CTA button | Closer |

## Production Workflow

1. **Script first.** Write VO sentences (short, punchy). Calibrate duration: a typical TTS voice at speed 1.0 reads ≈ 36 words in ≈ 21s; speed 1.2 ≈ 17s. Target: VO duration + 0.7s inter-sentence gaps ≤ ad length limit.
2. **AI hook clip** (e.g. `seedance-1-5-pro`):
   - Render a **draft first** (480p, roughly 40% cheaper) → verify via frame extraction + image model review before paying for 1080p
   - Final: `POST https://oatda.com/api/v1/llm/generate-video` via direct curl (see pitfalls), ~100–120s generation, `provider` field REQUIRED
   - `model_params`: `{"ratio":"16:9","resolution":"1080p","watermark":false,"generate_audio":false,"draft":false}`
   - Prompt rule: motion only, **no text or logos in the AI clip** — text comes as a Remotion overlay
3. **TTS voiceover**: `generate_speech` per sentence → **download immediately** (signed URLs expire ~8 min) → concat with 0.7s gaps + 0.3s lead + 0.5s tail (`ffmpeg -f concat`, paths relative to the .txt!) → master chain → MP3 256k
4. **Music mix**: voice + licensed track @ ~0.28 volume, `amix normalize=0`, fade out over the last 1.5s
5. **Screenshots**: `google-chrome --headless --virtual-time-budget=10000` (client-rendered pages need it). Auth-walled pages → screenshot manually in a logged-in browser, or build a `CodeScene` mock instead
6. **Remotion render**: `npx remotion render src/index.ts <composition-id> out/raw.mp4` (~2 min)
7. **Mux**: `ffmpeg -i raw.mp4 -i mixed.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k` — **never `-shortest`**
8. **QA gate**: see below — mandatory before delivering any draft

## Timing Model (30fps)

VO start + ~0.5s pre-roll per scene; scene length in frames = round(seconds × 30). Derive scene boundaries from the VO: run `silencedetect` on the voiceover, treat gaps > 0.9s as sentence/scene boundaries.

```bash
ffmpeg -i vo.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1 | grep silence_
```

## Project Layout

- Compositions: `<project>/src/Ads/*.tsx` (one file per ad, scenes as components)
- Registration: `<project>/src/Root.tsx` (one `<Composition>` per ad)
- Media assets: `<project>/public/videos/`, `<project>/public/images/screenshots/` (accessed via `staticFile('...')`)
- Voiceover: `<project>/audio/` (vo-*.wav, vo-final.mp3, mixed.mp3)
- Render output: `<project>/out/` (raw.mp4, final.mp4)

## Known Pitfalls (hard-won — read before starting)

- **AI video generation can outlive tool timeouts** on 1080p full quality (~100s+ generation). Call the video API with **direct curl** using your OATDA API key from the `OATDA_API_KEY` environment variable (never log the key), and allow an exec timeout ≥ 120s.
- **TTS download URLs expire ~8 min** (`{"error":"Unauthorized"}` after that). Generation and download must happen back-to-back. Corrupt-file check: `file *.wav` must report audio, not JSON.
- **ffmpeg concat paths** are relative to the concat `.txt` file's location, not the current working directory.
- **Headless Chrome screenshots of client-rendered pages** come back empty without `--virtual-time-budget=10000`.
- **Remotion needs `<OffthreadVideo>`** for h264 MP4s — plain `<Video>` fails.
- **Remotion renders silent** — audio is always muxed separately with ffmpeg afterwards.

## Render QA Gate (mandatory before delivering a draft)

Run every check below on the final muxed MP4. Emit **one PASS/FAIL line per check** in the delivery report; fix and re-render on any FAIL.

1. **Specs** — `ffprobe` duration within ±0.5s of plan, expected resolution/fps, exactly 1 video + 1 audio stream.
2. **Black frames** — `blackdetect`: no black intervals longer than 0.2s.
3. **VO silence** — `silencedetect`: no unexpected voiceover silence gaps longer than 1s.
4. **Loudness** — `volumedetect`: mean volume between −17 and −20 dB.
5. **Visual review** — extract 1 frame per scene boundary + 1 mid-scene frame; each frame must be non-empty (not black/blank), then review visually.
6. **Audio coverage** — audio duration ≥ video duration − 0.2s.

```bash
# 1 — specs
ffprobe -v error -show_entries format=duration -show_entries stream=codec_type,width,height,r_frame_rate final.mp4
# 2 — black intervals (want: none > 0.2s)
ffmpeg -i final.mp4 -vf blackdetect=d=0.2:pic_th=0.98 -f null - 2>&1 | grep blackdetect
# 3 — VO silence gaps (want: none > 1s mid-sentence)
ffmpeg -i final.mp4 -af silencedetect=noise=-35dB:d=1 -f null - 2>&1 | grep silence_
# 4 — mean volume (want: −17 to −20 dB)
ffmpeg -i final.mp4 -af volumedetect -f null - 2>&1 | grep mean_volume
# 5 — QA frames (one per boundary/mid-scene, then inspect)
ffmpeg -i final.mp4 -vf "select='eq(n,60)+eq(n,250)+eq(n,400)+eq(n,650)'" -vsync vfr qa_%d.png
```

## Cost Control

Render hook-clip drafts at 480p and only promote to 1080p once framing and motion are approved. Draft iterations typically cost a fraction of the final render; TTS is negligible.

## Music & Licensing

Only use music you are licensed to use. CC-BY tracks (e.g. Kevin MacLeod, incompetech.com) require **crediting the artist in the video description** wherever the ad is published, for example:

```
Music: Wallpaper — Kevin MacLeod, incompetech.com
```

## Honesty of On-Screen Numbers

If the ad quotes live counts or metrics, keep them in the composition's `defaultProps` as the single source of truth, refresh them per render, and prefer rounded-up floors on screen and in VO ("200+") so the ad never states a number that has since dropped.
