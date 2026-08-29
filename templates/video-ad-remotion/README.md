# OATDA Video-Ad Remotion Template

Vollständige Pipeline-Doku für eigenständige Ad-Produktion (Stand 2026-08-29, Run #1/#2).

## Setup (lokal, bei Chris) — SO LÄUFT ES BEI BOB (Stand 2026-08-29)

**System-Voraussetzungen:**
1. **Node.js LTS v22** (bei Bob: v22.22.3) — nodejs.org Installer (Win) / `brew install node` (Mac). Check: `node -v`
2. **ffmpeg 6.x** (bei Bob: 6.1.1) — für Audio-Kette + Mux + QA. Win: `winget install ffmpeg`, Mac: `brew install ffmpeg`. Check: `ffmpeg -version`

**Projekt-Setup (exakt Bobs Versionen — alle @remotion/* MÜSSEN gleiche Version sein!):**
```bash
mkdir oatda-video-ad && cd oatda-video-ad
npm init -y
npm i remotion@4.0.445 @remotion/cli@4.0.445 @remotion/renderer@4.0.445 react@19.2.4 react-dom@19.2.4
```

**Struktur anlegen:**
- `src/index.ts` → `registerRoot(RemotionRoot)`
- `src/Root.tsx` → `<Composition id=... component=... durationInFrames fps={30} width={1920} height={1080}/>` (Muster in Root-Auszug)
- `src/Ads/*.tsx` aus diesem Template kopieren
- `public/videos/` + `public/images/screenshots/` anlegen, eigene Assets rein (Zugriff via `staticFile('...')`)

**Render-Browser:** Beim ersten `npx remotion render` lädt Remotion automatisch die Chrome Headless Shell herunter (einmalig, Internet nötig). Alternativ vorher: `npx remotion browser ensure`.

**LIVE-VORSCHAU beim Bauen (Gold wert!):**
```bash
npx remotion studio   # öffnet http://localhost:3000 — Komposition live scrubben/tunen
```

**Render + Scripts (Bobs package.json):**
- `npm run render -- <comp-id> out/raw.mp4` (oder direkt `npx remotion render`)
- `npm start` = Studio

**Fonts (wichtig!):** Kompos nutzen `fontFamily: 'Inter, system-ui'` — auf deinem System muss **Inter installiert** sein (fonts.google.com/Inter), sonst greift ein Fallback. Robuster: `npm i @remotion/google-fonts` und `import {loadFont} from '@remotion/google-fonts/Inter'` — dann ist der Font auf JEDEM System deterministisch.

## Szenen-Baukasten (siehe GrokAdRun2.tsx)
MgHook (Logo-Reveal+Typo, $0) · ShotScene (Screenshot+Zoom+Crossfade) · Punchline-Overlay · Outro.
OffthreadVideo statt <Video> für h264! Remotion rendert STUMM — Audio immer separat muxen.

## Timing aus VO (Silence-Analyse)
```bash
ffmpeg -i vo.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1 | grep silence_
```
Große Pausen (>0.9s) = Satz-/Szenengrenzen. Frames = Sekunden × 30.

## Audio-Kette (V1.1-Formel, bewährt Run #2)
1. TTS pro Satz (OATDA /api/v1/llm/speech, provider-Pflicht) → SOFORT downloaden (URL ~8 Min!)
2. Optional concat pro Satz mit 0.7s-Gaps (concat-Datei: Pfade relativ zur .txt!)
3. Master-Mix (vereinfacht, statt SoX-Kette):
```bash
ffmpeg -i vo.mp3 -i music.mp3 -filter_complex \
"[0:a]volume=2.5dB,atrim=0:24,apad=pad_dur=1,atrim=0:24[v];\
[1:a]volume=0.5,afade=t=in:st=0:d=0.8,afade=t=out:st=22.4:d=1.6,atrim=0:24[m];\
[v][m]amix=inputs=2:normalize=0:duration=first[out]" -map "[out]" -b:a 256k mixed.mp3
```
Ziel-Pegel: mean −17 bis −20 dB (volumedetect checken).

## Mux (nie -shortest!)
```bash
ffmpeg -i raw.mp4 -i mixed.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k final.mp4
```

## QA
ffprobe Dauer/Größe · volumedetect (−17/−20) · 4 Frames extrahieren + Blickcheck:
```bash
ffmpeg -i final.mp4 -vf "select='eq(n,60)+eq(n,250)+eq(n,400)+eq(n,650)'" -vsync vfr qa_%d.png
```

## Screenshot-Rezept (manuell, beste Qualität)
Chrome DE-UI, F11 Vollbild, 1280×720+ — Dashboard/Playground/OneAgent eingeloggt. Für headless (Server): google-chrome --headless --no-sandbox --screenshot=out.png --window-size=1440,900 --virtual-time-budget=10000 URL (nur public-Seiten; auth-Wand → manuell oder Mock).

## Zahlen-Ehrlichkeit
Root.tsx defaultProps = Quelle (14 Provider / 245 Modelle, verschiebbar) → im Ad immer Plus-Floors: "14 Provider · 245+ Modelle".
