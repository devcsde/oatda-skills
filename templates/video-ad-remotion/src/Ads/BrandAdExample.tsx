import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

/**
 * BrandAdExample — a complete, self-contained 4-scene ad template.
 *
 * Placeholder brand: "Acme" (replace with the user's brand). The structure is:
 *
 *   1. HookScene      — AI-generated video clip + text overlay (opener, 3-5s)
 *   2. ScreenshotScene — real product screenshot, slow zoom + gradient + text
 *   3. CodeScene      — terminal card with line-by-line reveal (technical claims)
 *   4. OutroScene     — brand, tagline, URL, CTA
 *
 * ── CUSTOMIZATION POINTS ──────────────────────────────────────────────────
 *  • BRAND constants below: name, tagline, URL, accent color, font
 *  • Scene boundaries (HOOK_END / SHOT_END / CODE_END): derived from the VO
 *    silence analysis — see README "Timing from voiceover"
 *  • Copy: every `text` / `sub` / `line` string
 *  • Media paths: `staticFile('videos/...')` and `staticFile('images/...')`
 *    point into the project's `public/` folder
 *  • Timing of each overlay: the `from` / `durationInFrames` props
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Timing here: 720 frames @ 30fps = 24.0s total.
 * Remotion renders SILENT — mux the finished audio track with ffmpeg afterwards.
 */

/** ===== 1. BRAND — replace everything in this block ===== */
const BRAND = {
	name: 'Acme',
	tagline: 'Ship faster.',
	url: 'acme.example.com',
	cta: 'Start free',
};
/** Accent color for headlines, CTA and glow effects. */
const ACCENT = '#3b82f6';
/** Base background of the whole ad. */
const BG_DARK = '#04070f';
/** Font stack — see README "Fonts" for deterministic rendering. */
const FONT = 'Inter, system-ui, sans-serif';

/** ===== 2. SCENE BOUNDARIES (frames @ 30fps) — retune per voiceover ===== */
const HOOK_END = 170; // 5.67s  — end of hook / start of screenshot scene
const SHOT_END = 335; // 11.17s — end of screenshot / start of code scene
const CODE_END = 466; // 15.53s — end of code / start of outro
const TOTAL = 720; // 24.0s  — must match Root.tsx durationInFrames

/** Bottom-anchored text overlay that fades in and out. Used on top of any scene. */
const Overlay: React.FC<{
	readonly text: string;
	readonly sub?: string;
}> = ({text, sub}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 8, 40, 50], [0, 1, 1, 0], {
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 130}}>
			<div
				style={{
					opacity,
					textAlign: 'center',
					fontFamily: FONT,
					color: 'white',
					fontSize: 58,
					fontWeight: 700,
					textShadow: '0 4px 24px rgba(0,0,0,0.9)',
					maxWidth: 1450,
					lineHeight: 1.25,
				}}
			>
				{text}
				{sub ? (
					<div style={{fontSize: 34, fontWeight: 500, color: '#cbd5e1', marginTop: 14}}>{sub}</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

/**
 * Scene 1 — Hook.
 * Plays an AI-generated clip (OATDA video API) full-bleed under a darkening
 * gradient so the overlay text stays readable.
 *
 * `<OffthreadVideo>` is REQUIRED for h264 MP4s — plain `<Video>` fails.
 * Put the clip at `public/videos/hook.mp4`.
 */
const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, HOOK_END], [1, 1.06]); // subtle push-in
	return (
		<AbsoluteFill>
			<OffthreadVideo
				src={staticFile('videos/hook.mp4')}
				style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}}
			/>
			{/* Legibility gradient — tune the alphas to your clip */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(to top, rgba(3,7,18,0.85) 0%, rgba(3,7,18,0.15) 45%, rgba(3,7,18,0.25) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

/**
 * Scene 2 — Screenshot proof.
 * Real product screenshot with a slow zoom. Optionally cross-fades to a second
 * screenshot mid-scene (`nextImg` + `crossAt`, in local frames).
 * Put screenshots at `public/images/screenshots/*.png`.
 */
const ScreenshotScene: React.FC<{
	readonly img: string;
	readonly nextImg?: string;
	readonly crossAt?: number;
}> = ({img, nextImg, crossAt = 60}) => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [0, 110], [1.05, 1.14]);
	const nextOp = nextImg
		? interpolate(frame, [crossAt, crossAt + 10], [0, 1], {extrapolateRight: 'clamp'})
		: 0;
	return (
		<AbsoluteFill style={{backgroundColor: '#0a0f1a'}}>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<div style={{position: 'relative'}}>
					<Img
						src={staticFile(img)}
						style={{
							width: 1500,
							borderRadius: 18,
							boxShadow: `0 30px 90px ${ACCENT}59`, // 35% alpha accent glow
							transform: `scale(${scale})`,
						}}
					/>
					{nextImg ? (
						<Img
							src={staticFile(nextImg)}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: 1500,
								borderRadius: 18,
								boxShadow: `0 30px 90px ${ACCENT}59`,
								transform: `scale(${scale})`,
								opacity: nextOp,
							}}
						/>
					) : null}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/**
 * Scene 3 — Code / technical claim.
 * A terminal-style card whose lines reveal one after another. Replace the
 * `lines` with a real, verifiable snippet or command from the product.
 */
const CodeScene: React.FC = () => {
	const lines = [
		'$ curl -X POST https://api.acme.example.com/v1/run \\',
		'    -H "Authorization: Bearer $ACME_KEY" \\',
		'    -d \'{"task": "deploy"}\'',
		'# ✓ done in 1.8s',
	];
	const lineDelay = 22; // frames between line reveals
	return (
		<AbsoluteFill style={{backgroundColor: BG_DARK, justifyContent: 'center', alignItems: 'center'}}>
			<div
				style={{
					width: 1200,
					backgroundColor: '#0b1120',
					border: `1px solid ${ACCENT}40`,
					borderRadius: 16,
					padding: '36px 44px',
					fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
					fontSize: 30,
					lineHeight: 1.7,
					color: '#e2e8f0',
					boxShadow: `0 30px 90px ${ACCENT}40`,
				}}
			>
				{lines.map((line, i) => (
					<CodeLine key={i} text={line} delay={i * lineDelay} accent={i === lines.length - 1} />
				))}
			</div>
		</AbsoluteFill>
	);
};

const CodeLine: React.FC<{readonly text: string; readonly delay: number; readonly accent: boolean}> = ({
	text,
	delay,
	accent,
}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {extrapolateRight: 'clamp'});
	const nudge = interpolate(frame, [delay, delay + 8], [10, 0], {extrapolateRight: 'clamp'});
	return (
		<div style={{opacity, transform: `translateX(${nudge}px)`, color: accent ? ACCENT : undefined}}>
			{text}
		</div>
	);
};

/** Scene 4 — Outro: brand, tagline, URL, CTA button. */
const OutroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
	const rise = interpolate(frame, [6, 24], [30, 0], {extrapolateRight: 'clamp'});
	const ctaOp = interpolate(frame, [14, 26], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse at center, ${ACCENT}26 0%, ${BG_DARK} 70%)`,
				justifyContent: 'center',
				alignItems: 'center',
				opacity,
			}}
		>
			<div style={{textAlign: 'center', transform: `translateY(${rise}px)`, fontFamily: FONT}}>
				<div
					style={{
						fontSize: 150,
						fontWeight: 800,
						color: 'white',
						letterSpacing: 4,
						textShadow: `0 0 60px ${ACCENT}99`,
					}}
				>
					{BRAND.name}
				</div>
				<div style={{fontSize: 40, color: ACCENT, fontWeight: 600, marginTop: 18, letterSpacing: 2}}>
					{BRAND.tagline}
				</div>
				<div style={{fontSize: 32, color: '#94a3b8', fontWeight: 600, marginTop: 26, letterSpacing: 1}}>
					{BRAND.url}
				</div>
				<div
					style={{
						opacity: ctaOp,
						display: 'inline-block',
						marginTop: 56,
						padding: '18px 56px',
						borderRadius: 999,
						backgroundColor: ACCENT,
						color: 'white',
						fontSize: 34,
						fontWeight: 700,
						boxShadow: `0 12px 40px ${ACCENT}66`,
					}}
				>
					{BRAND.cta}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** The composition — registered in Root.tsx as `brand-ad-example`. */
export const BrandAdExample: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: BG_DARK}}>
			{/* Scene 1: AI hook clip + opening line */}
			<Sequence from={0} durationInFrames={HOOK_END}>
				<HookScene />
			</Sequence>
			<Sequence from={0} durationInFrames={62}>
				<Overlay text="The old way: five tools, five bills." />
			</Sequence>
			<Sequence from={66} durationInFrames={82}>
				<Overlay text="Acme does it in one." sub="Deploy · Monitor · Scale" />
			</Sequence>

			{/* Scene 2: product screenshots + feature proof */}
			<Sequence from={HOOK_END} durationInFrames={SHOT_END - HOOK_END}>
				<ScreenshotScene img="images/screenshots/acme-dashboard.png" nextImg="images/screenshots/acme-insights.png" crossAt={70} />
			</Sequence>
			<Sequence from={HOOK_END + 14} durationInFrames={SHOT_END - HOOK_END - 14}>
				<Overlay text="Everything in one dashboard." />
			</Sequence>

			{/* Scene 3: code claim */}
			<Sequence from={SHOT_END} durationInFrames={CODE_END - SHOT_END}>
				<CodeScene />
			</Sequence>

			{/* Scene 4: outro + CTA (runs to the end) */}
			<Sequence from={CODE_END} durationInFrames={TOTAL - CODE_END}>
				<OutroScene />
			</Sequence>
		</AbsoluteFill>
	);
};
