import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

/**
 * OATDA Ad Run #2 (2026-08-29) — Text-Deck freigegeben (Chris 18:30 GO).
 * Motion-Graphics-Hook (kein AI-Clip), echte Screenshots (DE UI), Punchlines statt Sätze.
 * Timing-Annahme: FINAL: 24.0s / 720 frames @30fps (VO 23.22s + Tail) — Timing aus Silence-Analyse.
 * VO-Skript: 1) „Vierzehn Provider, über zweihundert Modelle — und du integrierst nur eine API."
 *            2) „Chat, Vision, Bild, Stimme, Video — sogar in Echtzeit."
 *            3) „Mit MCP und OneAgent direkt in deinem Workflow."
 *            4) „OATDA. Der API-Aggregator. oatda.com."
 */
const HOOK_END = 170; // 5.65s — Ende S1 (Silence 5.65-6.80)
const MODELS_END = 335; // 11.16s — Ende S2 (Silence 11.16-12.18)
const PLAY_END = 466; // 15.54s — Ende S3 (Silence 15.54-16.57)
const ACCENT = '#3b82f6';

const Punchline: React.FC<{readonly text: string; readonly sub?: string; readonly small?: boolean}> = ({
	text,
	sub,
	small,
}) => {
	const frame = useCurrentFrame();
	const inOp = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
	const rise = interpolate(frame, [0, 10], [26, 0], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-end',
				alignItems: 'center',
				paddingBottom: 120,
				opacity: inOp,
				transform: `translateY(${rise}px)`,
			}}
		>
			<div style={{textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif'}}>
				<div
					style={{
						color: 'white',
						fontSize: small ? 52 : 66,
						fontWeight: 800,
						textShadow: '0 4px 28px rgba(0,0,0,0.9)',
						letterSpacing: 0.5,
					}}
				>
					{text}
				</div>
				{sub ? (
					<div
						style={{
							fontSize: 36,
							fontWeight: 600,
							color: ACCENT,
							marginTop: 14,
							textShadow: '0 2px 16px rgba(0,0,0,0.9)',
						}}
					>
						{sub}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

/** Motion-Graphics-Hook: Logo-Reveal + Typo-Animation (kein AI-Clip). */
const MgHook: React.FC = () => {
	const frame = useCurrentFrame();
	const blur = interpolate(frame, [0, 30], [24, 0], {extrapolateRight: 'clamp'});
	const logoOp = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
	const logoScale = interpolate(frame, [0, 30], [1.25, 1], {extrapolateRight: 'clamp'});
	const l1 = interpolate(frame, [26, 40], [0, 1], {extrapolateRight: 'clamp'});
	const l2 = interpolate(frame, [34, 48], [0, 1], {extrapolateRight: 'clamp'});
	const gridOp = interpolate(frame, [0, 20, 100, 120], [0, 0.14, 0.14, 0], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{backgroundColor: '#04070f', justifyContent: 'center', alignItems: 'center'}}>
			<AbsoluteFill
				style={{
					opacity: gridOp,
					backgroundImage:
						'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
					backgroundSize: '90px 90px',
					maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
				}}
			/>
			<div
				style={{
					opacity: logoOp,
					filter: `blur(${blur}px)`,
					transform: `scale(${logoScale})`,
					fontFamily: 'Inter, system-ui, sans-serif',
					fontSize: 170,
					fontWeight: 800,
					color: 'white',
					letterSpacing: 6,
					textShadow: '0 0 80px rgba(59,130,246,0.75)',
				}}
			>
				OATDA
			</div>
			<div
				style={{
					position: 'absolute',
					marginTop: 300,
					textAlign: 'center',
					fontFamily: 'Inter, system-ui, sans-serif',
				}}
			>
				<div style={{opacity: l1, fontSize: 60, color: 'white', fontWeight: 700}}>
					Alle KI-APIs.
				</div>
				<div style={{opacity: l2, fontSize: 60, color: ACCENT, fontWeight: 800, marginTop: 8}}>
					Ein Endpoint.
				</div>
			</div>
		</AbsoluteFill>
	);
};

const ShotScene: React.FC<{readonly img: string; readonly nextImg?: string; readonly crossAt?: number; readonly zoom?: boolean}> = ({
	img,
	nextImg,
	crossAt = 60,
	zoom = true,
}) => {
	const frame = useCurrentFrame();
	const scale = zoom ? interpolate(frame, [0, 110], [1.05, 1.14]) : 1.05;
	const nextOp = nextImg ? interpolate(frame, [crossAt, crossAt + 10], [0, 1], {extrapolateRight: 'clamp'}) : 0;
	return (
		<AbsoluteFill style={{backgroundColor: '#0a0f1a'}}>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<div style={{position: 'relative'}}>
					<Img
						src={staticFile(img)}
						style={{
							width: 1500,
							borderRadius: 18,
							boxShadow: '0 30px 90px rgba(59,130,246,0.35)',
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
								boxShadow: '0 30px 90px rgba(59,130,246,0.35)',
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

const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const op = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
	const word = interpolate(frame, [6, 24], [34, 0], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill
			style={{
				background: 'radial-gradient(ellipse at center, #10233f 0%, #04070f 70%)',
				justifyContent: 'center',
				alignItems: 'center',
				opacity: op,
			}}
		>
			<div style={{textAlign: 'center', transform: `translateY(${word}px)`, fontFamily: 'Inter, system-ui, sans-serif'}}>
				<div
					style={{
						fontSize: 160,
						fontWeight: 800,
						color: 'white',
						letterSpacing: 6,
						textShadow: '0 0 70px rgba(59,130,246,0.65)',
					}}
				>
					OATDA
				</div>
				<div style={{fontSize: 44, color: ACCENT, fontWeight: 700, marginTop: 20}}>Der API-Aggregator.</div>
				<div style={{fontSize: 36, color: '#94a3b8', fontWeight: 600, marginTop: 26, letterSpacing: 1}}>
					oatda.com
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const GrokAdRun2: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: '#04070f'}}>
			<Sequence from={0} durationInFrames={HOOK_END}>
				<MgHook />
			</Sequence>

			<Sequence from={HOOK_END} durationInFrames={MODELS_END - HOOK_END}>
				<ShotScene img="images/screenshots/oatda-models.jpg" nextImg="images/screenshots/oatda-dashboard.jpg" crossAt={70} />
			</Sequence>
			<Sequence from={HOOK_END + 14} durationInFrames={MODELS_END - HOOK_END - 14}>
				<Punchline text="14 Provider · 245+ Modelle" />
			</Sequence>

			<Sequence from={MODELS_END} durationInFrames={PLAY_END - MODELS_END}>
				<ShotScene img="images/screenshots/oatda-playground-1.jpg" nextImg="images/screenshots/oatda-playground-2.jpg" crossAt={50} />
			</Sequence>
			<Sequence from={MODELS_END + 12} durationInFrames={PLAY_END - MODELS_END - 12}>
				<Punchline text="MCP · OneAgent · Realtime" sub="Audio · Vision · Image · Video" />
			</Sequence>

			<Sequence from={PLAY_END}>
				<Outro />
			</Sequence>
		</AbsoluteFill>
	);
};
