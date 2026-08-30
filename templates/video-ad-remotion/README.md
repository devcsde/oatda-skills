# Video Ad Remotion Template

A Remotion scaffold for producing a branded video ad end to end: AI hook clip (OATDA video API), TTS voiceover (OATDA speech API), product screenshots, and ffmpeg mux/QA.

## Prerequisites

1. **Node.js LTS v22** — from nodejs.org, or `brew install node` (macOS) / `winget install OpenJS.NodeJS.LTS` (Windows). Check: `node -v`
2. **ffmpeg 6.x** — needed for the audio chain, muxing, and QA checks. Win: `winget install ffmpeg`, macOS: `brew install ffmpeg`. Check: `ffmpeg -version`
3. An **OATDA API key** in the `OATDA_API_KEY` environment variable (for TTS and AI video clips)

## Project Setup

Copy this template into a local project folder and install dependencies:

```bash
mkdir my-video-ad && cd my-video-ad
# copy src/ and package.json from this template
npm install
```

> **Important:** every `@remotion/*` package (and `remotion` itself) **must be pinned to the exact same version**. Mixed versions are the most common cause of cryptic render failures — install them together in one command, as the bundled `package.json` does.

Create these folders:

- `public/videos/` — AI hook clip(s)
- `public/images/screenshots/` — product screenshots
- `out/` — render output
- `audio/` — voiceover files

Entry points:

- `src/index.ts` → `registerRoot(RemotionRoot)`
- `src/Root.tsx` → one `<Composition id="..." component={...} durationInFrames={720} fps={30} width={1920} height={1080} />` per ad

**Render browser:** the first `npx remotion render` downloads the Chrome Headless Shell automatically (one-time, needs internet). To pre-fetch: `npx remotion browser ensure`.

**Live preview while building (highly recommended):**

```bash
npm start            # npx remotion studio → http://localhost:3000, scrub and tune live
```

**Fonts:** the example composition uses `fontFamily: 'Inter, system-ui'`. For deterministic rendering on every machine, install `@remotion/google-fonts` and load the font explicitly:

```bash
npm i @remotion/google-fonts
```

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont();
```

## Scene Types → `BrandAdExample.tsx`

The example composition `src/Ads/BrandAdExample.tsx` implements the full four-scene structure for a placeholder brand ("Acme"). Every customization point (brand constants, colors, fonts, copy, media paths, scene timing) is marked in the file.

| Scene | Component | What it shows |
|-------|-----------|---------------|
| Hook | `HookScene` | AI-generated clip (`OffthreadVideo`) under a gradient, with text overlay — the 3–5s opener |
| Screenshot | `ScreenshotScene` | Real product screenshot with slow zoom, optional cross-fade to a second screenshot |
| Code | `CodeScene` | Terminal card with line-by-line reveal, for API/SDK/technical claims |
| Outro | `OutroScene` | Brand, tagline, URL, CTA button |

Note: `<OffthreadVideo>` is **required** for h264 MP4s (plain `<Video>` fails), and Remotion renders **silent** — audio is always muxed afterwards.

## Timing from the Voiceover

Derive scene boundaries from silence analysis of the finished voiceover (gaps > 0.9s ≈ sentence/scene boundaries), then convert seconds to frames (seconds × 30 at 30 fps):

```bash
ffmpeg -i audio/vo.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1 | grep silence_
```

## Audio Chain

1. Generate TTS per sentence via `POST /api/v1/llm/speech` (the `provider` field is required) → **download immediately**; signed URLs expire after ~8 minutes
2. Optionally concat per-sentence files with 0.7s gaps (in a concat `.txt`, paths are relative to the **txt file's location**, not the CWD)
3. Master mix — voice plus music, normalized and faded:

```bash
ffmpeg -i audio/vo.mp3 -i audio/music.mp3 -filter_complex \
"[0:a]volume=2.5dB,atrim=0:24,apad=pad_dur=1,atrim=0:24[v];\
[1:a]volume=0.5,afade=t=in:st=0:d=0.8,afade=t=out:st=22.4:d=1.6,atrim=0:24[m];\
[v][m]amix=inputs=2:normalize=0:duration=first[out]" -map "[out]" -b:a 256k audio/mixed.mp3
```

Target loudness: mean volume between −17 and −20 dB (verify with `volumedetect`).

## Render + Mux

```bash
# 1 — render the video (silent)
npm run render -- brand-ad-example out/raw.mp4
# equivalent: npx remotion render src/index.ts brand-ad-example out/raw.mp4

# 2 — mux the audio in (never use -shortest)
ffmpeg -i out/raw.mp4 -i audio/mixed.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k out/final.mp4
```

## QA

Run the full QA gate from `skills/oatda-video-ad-creator/SKILL.md` (specs, blackdetect, silencedetect, volumedetect, frame extraction, audio coverage). A quick frame check:

```bash
ffmpeg -i out/final.mp4 -vf "select='eq(n,60)+eq(n,250)+eq(n,400)+eq(n,650)'" -vsync vfr qa_%d.png
```

## Screenshots

Best quality is a manual capture: full screen (F11), 1280×720 or larger, logged in. For headless/server-side capture of public pages:

```bash
google-chrome --headless --no-sandbox --screenshot=out.png \
  --window-size=1440,900 --virtual-time-budget=10000 <URL>
```

`--virtual-time-budget=10000` is required for client-rendered pages, otherwise the shot comes back empty. Auth-walled pages can't be captured headless — screenshot them manually or mock the UI.

## Music & Licensing

Only use music you are licensed to publish. CC-BY tracks (e.g. Kevin MacLeod, incompetech.com) require **crediting the artist in the video description** wherever the ad is published:

```
Music: Wallpaper — Kevin MacLeod, incompetech.com
```

Replace the track name accordingly. Internal-only previews without credit are fine; anything published needs the credit.
