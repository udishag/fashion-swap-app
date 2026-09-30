// frontend/src/components/FitPredictor.jsx

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';

const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001';

// ── Feature flags ──────────────────────────────────────────────────────────
// Flip SHOW_3D to true to bring the 3D drape tab back.
// Flip ENABLE_AI_TRYON to true only if you later add a real try-on model (paid).
const SHOW_3D = false;
const ENABLE_AI_TRYON = false;

// Keep in sync with TIGHT_BELOW / LOOSE_ABOVE in machine-learning/fit_routes.py
const TIGHT_BELOW = -0.5;
const LOOSE_ABOVE = 4.0;

// Base mannequin proportions (in inches) for the 3D model
const BASE_MEASUREMENTS = { bust: 34.0, waist: 26.0, hips: 36.0 };

// Stylised torso canvas dimensions
const VB_W = 280;
const VB_H = 360;
const CX = VB_W / 2;
const PX_PER_INCH = 3.4;

// Photo view: hoodie photos include sleeves, so the photo is wider than the bust width
const PHOTO_WIDTH_FACTOR = 1.9;
const PHOTO_MIN_W = 130;
const PHOTO_MAX_W = 270;

const ZONES = [
    { key: 'bust', label: 'Bust', y: 105, photoY: 115 },
    { key: 'waist', label: 'Waist', y: 190, photoY: 198 },
    { key: 'hips', label: 'Hips', y: 265, photoY: 281 },
];

const STATUS = {
    tight: { color: '#D64045', text: '#D64045', tag: '↔ pulling' },
    loose: { color: '#4086D6', text: '#4086D6', tag: '→← baggy' },
    ideal: { color: '#D2DB76', text: '#5C6510', tag: '✓ ideal' },
};

// ── helpers ────────────────────────────────────────────────────────────────
const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const classify = (user, item) => {
    if (user == null || item == null) return null;
    const ease = Math.round((item - user) * 10) / 10;
    const status = ease < TIGHT_BELOW ? 'tight' : ease > LOOSE_ABOVE ? 'loose' : 'ideal';
    return { user, item, ease, status };
};

const fmtEase = (e) => `${e > 0 ? '+' : e < 0 ? '−' : '±'}${Math.abs(e).toFixed(1)}"`;
const halfWidth = (inches) => (inches * PX_PER_INCH) / 2;

function smoothCurve(pts) {
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
}

function torsoPath({ shoulder, bust, waist, hips, hemY }) {
    const right = [
        [CX + 13, 10],
        [CX + 15, 36],
        [CX + shoulder, 60],
        [CX + bust, ZONES[0].y],
        [CX + waist, ZONES[1].y],
        [CX + hips, ZONES[2].y],
        [CX + hips - 2, hemY],
    ];
    const left = right.map(([x, y]) => [2 * CX - x, y]).reverse();
    return `M ${right[0][0]} ${right[0][1]}${smoothCurve(right)} L ${left[0][0]} ${left[0][1]}${smoothCurve(left)} Z`;
}

// ── 3D Mesh Component (only rendered when SHOW_3D is true) ─────────────────
function Garment3DModel({ url, scales }) {
    const { scene } = useGLTF(url);
    return (
        <primitive
            object={scene}
            scale={[scales.scaleX, scales.scaleY, scales.scaleZ]}
            position={[0, -0.6, 0]}
        />
    );
}

// ── tension line (SVG) ─────────────────────────────────────────────────────
function TensionLine({ y, half, status, label, ease }) {
    const s = STATUS[status];
    const x1 = CX - half - 10;
    const x2 = CX + half + 10;
    return (
        <g>
            <line x1={x1} x2={x2} y1={y} y2={y} stroke={s.color} strokeWidth="2" />
            <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} stroke={s.color} strokeWidth="2" />
            <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} stroke={s.color} strokeWidth="2" />
            <rect x={CX - 54} y={y - 25} width="108" height="18" rx="4" fill="#FCFAF8" fillOpacity="0.92" />
            <text x={CX} y={y - 12} textAnchor="middle" fontSize="9.5" fontWeight="800" letterSpacing="0.05em" fill={s.text}>
                {`${label.toUpperCase()} ${s.tag}`}
            </text>
            <text x={x2 + 5} y={y + 3} fontSize="9" fontWeight="700" fill={s.text}>{fmtEase(ease)}</text>
        </g>
    );
}

const card = { backgroundColor: '#fff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const eyebrow = { fontSize: '0.85rem', color: '#777', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' };

export default function FitPredictor({ targetItem, userProfile }) {
    const [serverDetails, setServerDetails] = useState(null);
    const [view, setView] = useState('body'); // 'body' | 'photo' | '3d'

    // "What if" slider overrides for the user's measurements (does not change the saved profile)
    const [adjust, setAdjust] = useState({});

    // Optional AI try-on state (only used if ENABLE_AI_TRYON)
    const [vtonImage, setVtonImage] = useState(null);
    const [vtonState, setVtonState] = useState('idle'); // idle | loading | done | error
    const [vtonError, setVtonError] = useState('');

    // Optional 3D state (only used if SHOW_3D)
    const [meshUrl, setMeshUrl] = useState(null);
    const [meshState, setMeshState] = useState('idle'); // idle | loading | done | error
    const [meshError, setMeshError] = useState('');

    const um = userProfile?.measurements;
    const baseUser = useMemo(
        () => ({ bust: num(um?.bust), waist: num(um?.waist), hips: num(um?.hips) }),
        [um?.bust, um?.waist, um?.hips]
    );

    const user = useMemo(
        () => ({
            bust: adjust.bust ?? baseUser.bust,
            waist: adjust.waist ?? baseUser.waist,
            hips: adjust.hips ?? baseUser.hips,
        }),
        [baseUser, adjust]
    );
    const isAdjusted = Object.keys(adjust).length > 0;

    const item = useMemo(() => {
        const nested = targetItem?.measurements || {};
        const pick = (k) => num(nested[k] ?? targetItem?.[k]);
        return { bust: pick('bust'), waist: pick('waist'), hips: pick('hips') };
    }, [targetItem]);

    // Dimensional scaling calculation for the 3D model
    const scales3D = useMemo(() => {
        const b = user.bust || BASE_MEASUREMENTS.bust;
        const w = user.waist || BASE_MEASUREMENTS.waist;
        const h = user.hips || BASE_MEASUREMENTS.hips;
        return {
            scaleX: ((b / BASE_MEASUREMENTS.bust) + (h / BASE_MEASUREMENTS.hips)) / 2,
            scaleY: 1.0,
            scaleZ: w / BASE_MEASUREMENTS.waist,
        };
    }, [user]);

    const localDetails = useMemo(() => {
        const out = {};
        ZONES.forEach(({ key }) => {
            const d = classify(user[key], item[key]);
            if (d) out[key] = d;
        });
        return out;
    }, [user, item]);
    const details = serverDetails || localDetails;

    const measureKey = JSON.stringify([user, item]);
    useEffect(() => {
        setServerDetails(null);
        if (!Object.keys(localDetails).length) return undefined;
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/calculate-drape`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: ctrl.signal,
                    body: JSON.stringify({ user_measurements: user, item_measurements: item }),
                });
                const data = await res.json();
                if (data.status === 'success' && data.details) setServerDetails(data.details);
            } catch (err) {
                if (err.name !== 'AbortError') console.warn('drape endpoint unavailable, using local math', err);
            }
        })();
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [measureKey]);

    // Reset everything when a different item is opened
    useEffect(() => {
        setVtonImage(null);
        setVtonState('idle');
        setVtonError('');
        setMeshUrl(null);
        setMeshState('idle');
        setMeshError('');
        setAdjust({});
        setView('body');
    }, [targetItem?.id]);

    const bodyScanUrl = userProfile?.body_scan_url;
    const garmentUrl =
        targetItem?.clothImage ||
        targetItem?.cloth_image_url ||
        targetItem?.image_url ||
        targetItem?.imageUrl ||
        targetItem?.image ||
        (Array.isArray(targetItem?.images) ? targetItem.images[0] : null) ||
        null;

    const runVton = async () => {
        setVtonState('loading');
        setVtonError('');
        try {
            const res = await fetch(`${API_BASE}/api/generate-vton`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_image_url: bodyScanUrl,
                    garment_image_url: garmentUrl,
                    category: 'upper_body',
                    garment_description: [targetItem?.brand, targetItem?.color, targetItem?.title].filter(Boolean).join(' '),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.status !== 'success') throw new Error(data.error || `Server returned ${res.status}`);
            setVtonImage(data.vton_image);
            setVtonState('done');
            setView('photo');
        } catch (err) {
            setVtonError(err.message);
            setVtonState('error');
        }
    };

    const run3DGeneration = async () => {
        setMeshState('loading');
        setMeshError('');
        try {
            const res = await fetch(`${API_BASE}/api/generate-3d-garment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ garment_image_url: garmentUrl }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.mesh_url) {
                throw new Error(data.error || `Server returned ${res.status}`);
            }
            setMeshUrl(data.mesh_url);
            setMeshState('done');
            setView('3d');
        } catch (err) {
            setMeshError(err.message);
            setMeshState('error');
        }
    };

    // ── guards ──
    const missingUser = ZONES.filter((z) => baseUser[z.key] == null).map((z) => z.key);
    if (missingUser.length) {
        return (
            <div style={{ backgroundColor: '#FCFAF8', border: '1px solid #D2DB76', borderRadius: '24px', padding: '32px', textAlign: 'center', color: '#28301C' }}>
                Add your {missingUser.join(', ')} in fit metrics to use the simulator.
            </div>
        );
    }

    // ── geometry ──
    const bodyHalf = { bust: halfWidth(user.bust), waist: halfWidth(user.waist), hips: halfWidth(user.hips) };
    const bodyPath = torsoPath({
        shoulder: Math.max(bodyHalf.bust * 0.98, bodyHalf.waist + 10),
        ...bodyHalf,
        hemY: 340,
    });

    const hasFullGarment = ZONES.every((z) => item[z.key] != null);
    const garmentPath = hasFullGarment
        ? torsoPath({
            shoulder: halfWidth(item.bust),
            bust: halfWidth(item.bust),
            waist: halfWidth(item.waist),
            hips: halfWidth(item.hips),
            hemY: 300,
        })
        : null;

    // Photo view: the hoodie photo is sized from the ITEM's bust, the body outline from YOUR measurements
    const photoW = clamp((item.bust ?? user.bust) * PX_PER_INCH * PHOTO_WIDTH_FACTOR, PHOTO_MIN_W, PHOTO_MAX_W);
    const showRealTryOn = ENABLE_AI_TRYON && vtonImage;
    const photoSrc = garmentUrl;

    const zoneHalf = (z) => Math.max(bodyHalf[z.key], item[z.key] != null ? halfWidth(item[z.key]) : 0);

    const zonesWith = (s) => ZONES.filter((z) => details[z.key]?.status === s).map((z) => z.key);
    const tight = zonesWith('tight');
    const loose = zonesWith('loose');
    const verdict = !Object.keys(details).length
        ? 'no garment measurements listed for this piece'
        : tight.length
            ? `pulls at ${tight.join(' + ')}`
            : loose.length
                ? `roomy at ${loose.join(' + ')}`
                : 'fits your measurements';

    const pill = (active) => ({
        flex: 1, padding: '8px 10px', border: 'none', borderRadius: '999px', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600, textTransform: 'lowercase',
        backgroundColor: active ? '#28301C' : '#F1F0EA', color: active ? '#FFC3CC' : '#28301C',
    });

    return (
        <div style={{ backgroundColor: '#FCFAF8', border: '1px solid #D2DB76', borderRadius: '24px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingRight: '44px' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', margin: 0, color: '#28301C' }}>moss fit simulator.</h3>
                <span style={{ backgroundColor: '#FFC3CC', color: '#28301C', fontSize: '0.8rem', fontWeight: '700', padding: '6px 16px', borderRadius: '999px', letterSpacing: '0.05em' }}>LIVE CALIBRATION</span>
            </div>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* LEFT: visual canvas */}
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '280px', height: '360px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F1F0EA', border: '1px solid #eee' }}>
                        {view === 'photo' ? (
                            showRealTryOn ? (
                                <>
                                    <img src={vtonImage} alt="Virtual try-on result" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                                        {ZONES.map((z) => details[z.key] && (
                                            <TensionLine key={z.key} y={z.photoY} half={62} status={details[z.key].status} label={z.label} ease={details[z.key].ease} />
                                        ))}
                                    </svg>
                                </>
                            ) : (
                                <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" role="img" aria-label="Garment photo sized against your body outline">
                                    {/* your body (fill), sized from your measurements */}
                                    <path d={bodyPath} fill="#E4DFD2" fillOpacity="0.7" />
                                    {/* garment photo, sized from the item's measurements; multiply blends away white photo backgrounds */}
                                    {photoSrc && (
                                        <image
                                            href={photoSrc}
                                            x={CX - photoW / 2}
                                            y={30}
                                            width={photoW}
                                            height={300}
                                            preserveAspectRatio="xMidYMid meet"
                                            style={{ mixBlendMode: 'multiply' }}
                                        />
                                    )}
                                    {/* your body outline on top so you can see where the garment sits against you */}
                                    <path d={bodyPath} fill="none" stroke="#28301C" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="5 4" />
                                    {ZONES.map((z) => details[z.key] && (
                                        <TensionLine
                                            key={z.key}
                                            y={z.y}
                                            half={zoneHalf(z)}
                                            status={details[z.key].status}
                                            label={z.label}
                                            ease={details[z.key].ease}
                                        />
                                    ))}
                                </svg>
                            )
                        ) : SHOW_3D && view === '3d' && meshUrl ? (
                            <div style={{ width: '100%', height: '100%', background: '#1c1c1c' }}>
                                <Canvas camera={{ position: [0, 0, 2.2], fov: 45 }}>
                                    <ambientLight intensity={0.9} />
                                    <directionalLight position={[5, 10, 5]} intensity={1.5} />
                                    <Suspense fallback={null}>
                                        <Center>
                                            <Garment3DModel url={meshUrl} scales={scales3D} />
                                        </Center>
                                    </Suspense>
                                    <OrbitControls enablePan={false} maxDistance={4.0} minDistance={1.0} />
                                </Canvas>
                            </div>
                        ) : (
                            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" role="img" aria-label="Mannequin silhouette">
                                <path d={bodyPath} fill="#E4DFD2" stroke="#28301C" strokeOpacity="0.55" strokeWidth="1.5" />
                                {garmentPath && (
                                    <path d={garmentPath} fill="#FFC3CC" fillOpacity="0.6" stroke="#28301C" strokeWidth="1.5" strokeDasharray="5 4" />
                                )}
                                {ZONES.map((z) => details[z.key] && (
                                    <TensionLine
                                        key={z.key}
                                        y={z.y}
                                        half={zoneHalf(z)}
                                        status={details[z.key].status}
                                        label={z.label}
                                        ease={details[z.key].ease}
                                    />
                                ))}
                            </svg>
                        )}
                    </div>

                    {/* View Selectors */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={pill(view === 'body')} onClick={() => setView('body')}>body fit</button>
                        <button
                            style={{ ...pill(view === 'photo'), opacity: garmentUrl ? 1 : 0.5, cursor: garmentUrl ? 'pointer' : 'not-allowed' }}
                            disabled={!garmentUrl}
                            onClick={() => setView('photo')}
                        >
                            photo
                        </button>
                        {SHOW_3D && (
                            <button style={pill(view === '3d')} disabled={!meshUrl} onClick={() => setView('3d')}>
                                3d drape
                            </button>
                        )}
                    </div>

                    {/* What-if sliders: drive both body fit and photo live */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: '#F1F0EA', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777' }}>try other measurements</span>
                            {isAdjusted && (
                                <button
                                    onClick={() => setAdjust({})}
                                    style={{ border: 'none', background: 'none', color: '#28301C', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                                >
                                    reset
                                </button>
                            )}
                        </div>
                        {ZONES.map((z) => (
                            <label key={z.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#28301C' }}>
                                <span style={{ width: '38px', textTransform: 'lowercase' }}>{z.label}</span>
                                <input
                                    type="range"
                                    min={Math.min(26, baseUser[z.key])}
                                    max={Math.max(54, baseUser[z.key])}
                                    step="0.5"
                                    value={user[z.key]}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setAdjust((a) => ({ ...a, [z.key]: v }));
                                    }}
                                    style={{ flex: 1, accentColor: '#28301C' }}
                                />
                                <span style={{ width: '38px', textAlign: 'right', fontWeight: 700 }}>{user[z.key]}"</span>
                            </label>
                        ))}
                    </div>

                    {/* Optional action triggers (hidden while the flags above are false) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ENABLE_AI_TRYON && bodyScanUrl && vtonState !== 'done' && (
                            <button
                                onClick={runVton}
                                disabled={vtonState === 'loading' || !garmentUrl}
                                style={{ padding: '10px', border: 'none', borderRadius: '12px', backgroundColor: '#D2DB76', color: '#28301C', fontWeight: 600, fontSize: '0.85rem', textTransform: 'lowercase', cursor: vtonState === 'loading' ? 'wait' : 'pointer', opacity: vtonState === 'loading' ? 0.7 : 1 }}
                            >
                                {vtonState === 'loading' ? 'generating try-on photo…' : 'generate photo try-on'}
                            </button>
                        )}

                        {SHOW_3D && meshState !== 'done' && (
                            <button
                                onClick={run3DGeneration}
                                disabled={meshState === 'loading' || !garmentUrl}
                                style={{ padding: '10px', border: '1px solid #28301C', borderRadius: '12px', backgroundColor: 'transparent', color: '#28301C', fontWeight: 600, fontSize: '0.85rem', textTransform: 'lowercase', cursor: meshState === 'loading' ? 'wait' : 'pointer', opacity: meshState === 'loading' ? 0.7 : 1 }}
                            >
                                {meshState === 'loading' ? 'building 3D mesh…' : 'generate 3D garment'}
                            </button>
                        )}
                    </div>

                    {ENABLE_AI_TRYON && vtonError && <p style={{ margin: 0, fontSize: '0.8rem', color: '#D64045' }}>{vtonError}</p>}
                    {SHOW_3D && meshError && <p style={{ margin: 0, fontSize: '0.8rem', color: '#D64045' }}>{meshError}</p>}
                </div>

                {/* RIGHT: analysis */}
                <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '1.05rem', color: '#28301C', fontFamily: 'var(--font-display)' }}>{verdict}</div>

                    {ZONES.map((z) => {
                        const d = details[z.key];
                        const c = d ? STATUS[d.status].text : '#28301C';
                        return (
                            <div key={z.key} style={card}>
                                <div style={eyebrow}>{z.label} Analysis</div>
                                <div style={{ fontSize: '0.95rem', color: '#28301C', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                    <span>
                                        You: <strong>{user[z.key]}"</strong> | Item: <strong>{item[z.key] != null ? `${item[z.key]}"` : '--'}</strong>
                                        {d && <span style={{ color: '#777' }}> ({fmtEase(d.ease)})</span>}
                                    </span>
                                    <span style={{ fontWeight: '700', color: c }}>{d ? d.status.toUpperCase() : 'N/A'}</span>
                                </div>
                            </div>
                        );
                    })}

                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#777' }}>
                        Body fit and photo update live. Drag the sliders to see how this piece would fit different measurements. The photo is sized from the item's measurements against your body outline.
                    </p>
                </div>
            </div>
        </div>
    );
}