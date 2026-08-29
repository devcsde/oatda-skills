import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

/**
 * Grok Übungs-Ad Run #1 (2026-08-29) — Built by Bob, script/assets by [Grok].
 * 435 frames @30fps = 14.5s. VO: 4 Sätze (13.66s) + 0.3s lead / 0.5s tail.
 * Timing from silencedetect: S1 ~0.3-2.0 | S2 ~2.3-4.9 | S3 ~5.4-7.3 | S4 ~7.7-9.2
 */
const HOOK_END = 151; // 5.04s clip length
const SHOT_END = 222; // ~7.4s
const ACCENT = '#3b82f6';

const Overlay: React.FC<{readonly text: string; readonly sub?: string}> = ({text, sub}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 8, 40, 50], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 130}}>
			<div
				style={{
					opacity,
					textAlign: 'center',
					fontFamily: 'Inter, system-ui, sans-serif',
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

const ScreenshotScene: React.FC = () => {
	const frame = useCurrentFrame();
	const scale = interpolate(frame, [0, 71], [1.06, 1.16]);
	return (
		<AbsoluteFill style={{backgroundColor: '#0a0f1a'}}>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<Img
					src={staticFile('images/screenshots/oatda-home-uebung.png')}
					style={{
						width: 1480,
						borderRadius: 18,
						boxShadow: '0 30px 90px rgba(59,130,246,0.35)',
						transform: `scale(${scale})`,
					}}
				/>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const OutroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
	const wordIn = interpolate(frame, [8, 26], [30, 0], {extrapolateRight: 'clamp'});
	const s4Opacity = interpolate(frame, [10, 20], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill
			style={{
				background: 'radial-gradient(ellipse at center, #10233f 0%, #050810 70%)',
				justifyContent: 'center',
				alignItems: 'center',
				opacity,
			}}
		>
			<div style={{opacity: s4Opacity, transform: `translateY(${wordIn}px)`, textAlign: 'center'}}>
				<div
					style={{
						fontFamily: 'Inter, system-ui, sans-serif',
						fontSize: 150,
						fontWeight: 800,
						color: 'white',
						letterSpacing: 4,
						textShadow: '0 0 60px rgba(59,130,246,0.6)',
					}}
				>
					OATDA
				</div>
				<div style={{fontSize: 40, color: ACCENT, fontWeight: 600, marginTop: 18, letterSpacing: 2}}>
					oatda.com
				</div>
				<div
					style={{
						marginTop: 60,
						fontSize: 30,
						color: '#94a3b8',
						fontFamily: 'Inter, system-ui, sans-serif',
					}}
				>
					Eine API. Alle Modelle.
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const GrokAdUebung: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: '#050810'}}>
			<Sequence from={0} durationInFrames={HOOK_END}>
				<AbsoluteFill>
					<OffthreadVideo
						src={staticFile('videos/hook-draft-480p-16x9.mp4')}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
					<AbsoluteFill
						style={{
							background:
								'linear-gradient(to top, rgba(3,7,18,0.85) 0%, rgba(3,7,18,0.15) 45%, rgba(3,7,18,0.25) 100%)',
						}}
					/>
				</AbsoluteFill>
			</Sequence>
			<Sequence from={0} durationInFrames={62}>
				<Overlay text="Fünf Provider, fünf Keys, fünf SDKs." />
			</Sequence>
			<Sequence from={66} durationInFrames={82}>
				<Overlay text="Oder eine API:" sub="Chat · Bild · Stimme · Video" />
			</Sequence>

			<Sequence from={HOOK_END} durationInFrames={SHOT_END - HOOK_END}>
				<ScreenshotScene />
			</Sequence>
			<Sequence from={HOOK_END + 10} durationInFrames={58}>
				<Overlay text="Ein Endpoint, ein Key." />
			</Sequence>

			<Sequence from={SHOT_END}>
				<OutroScene />
			</Sequence>
		</AbsoluteFill>
	);
};
