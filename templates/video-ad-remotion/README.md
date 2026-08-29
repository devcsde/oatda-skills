# OATDA Video-Ad Remotion Template

Vollständige Pipeline-Doku für eigenständige Ad-Produktion (Stand 2026-08-29, Run #1/#2).

## Setup (lokal, bei Chris)
```bash
mkdir video-ad && cd video-ad && npm init -y
npm i remotion @remotion/cli react react-dom
npx remotion install  # chromium für rendering
# src/index.ts + Root.tsx anlegen (Register pro Komposition), Ads/ aus diesem Template kopieren
# public/videos/ + public/images/screenshots/ anlegen und eigene Assets einfügen
npx remotion render <composition-id> out/raw.mp4
```

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
