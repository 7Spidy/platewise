import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import PWLock from './components/PWLock.jsx';
import PWHistory from './components/PWHistory.jsx';

// ──────────────────────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────────────────────
export const PW_TOKENS = {
  bg: '#FAFAF9',
  card: '#FFFFFF',
  ink: '#171513',
  inkSoft: '#5B5651',
  inkMute: '#A29C95',
  line: '#EFECE7',
  green: '#22C55E',
  greenInk: '#15803D',
  greenSoft: '#E7F8EE',
  carbs: '#6FA8FF',
  protein: '#F08A7A',
  fat: '#E8B056',
  yellowSoft: '#FFF7D6',
  yellowInk: '#7C5A00',
  shadow: '0 1px 2px rgba(20,16,12,0.04), 0 8px 28px rgba(20,16,12,0.06)',
  shadowSoft: '0 1px 2px rgba(20,16,12,0.04), 0 4px 16px rgba(20,16,12,0.04)',
};

const DEMO_CHIPS = ['Butter Chicken', 'Avocado Toast', 'Caesar Salad'];

// ──────────────────────────────────────────────────────────────
// Image compression — 600px max, always JPEG, with error handling
// ──────────────────────────────────────────────────────────────
function compressImage(file, maxPx = 600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image. The file may be corrupt or an unsupported format.'));
    };

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      // Always encode as JPEG — handles HEIC/HEIF and exotic formats safely
      const base64   = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      const mimeType = 'image/jpeg';
      resolve({ base64, mimeType });
    };

    img.src = url;
  });
}

// ──────────────────────────────────────────────────────────────
// PNG export hook — shared by mobile and desktop result screens
// ──────────────────────────────────────────────────────────────
function usePngExport(cardRef, food) {
  const [toast, setToast] = useState(null);

  const onDownload = async () => {
    if (!cardRef.current || !food) return;
    const filename = `platewise-${food.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        pixelRatio: 2,
        filter: (node) => !(node.classList && node.classList.contains('pw-no-export')),
      });
      const link    = document.createElement('a');
      link.download = filename;
      link.href     = dataUrl;
      link.click();
      setToast('Downloaded · ' + filename);
    } catch (e) {
      setToast('Download failed: ' + e.message);
    }
    setTimeout(() => setToast(null), 2400);
  };

  return { onDownload, toast };
}

// ──────────────────────────────────────────────────────────────
// Tiny inline icons
// ──────────────────────────────────────────────────────────────
const PWIcon = {
  leaf: (size = 16, color = PW_TOKENS.green) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z" fill={color}/>
      <path d="M5 19C9 15 13 11 19 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  sparkle: (size = 14, color = PW_TOKENS.green) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.6 9.2L20.8 10.8L13.6 12.4L12 19.6L10.4 12.4L3.2 10.8L10.4 9.2L12 2Z" fill={color}/>
      <path d="M19 16L19.6 18.4L22 19L19.6 19.6L19 22L18.4 19.6L16 19L18.4 18.4L19 16Z" fill={color}/>
    </svg>
  ),
  camera: (size = 20, color = '#fff') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 4L7.5 6H4C2.9 6 2 6.9 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H16.5L15 4H9Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.6"/>
    </svg>
  ),
  check: (size = 14, color = '#fff') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5L9.5 17L19 7.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: (size = 16, color = '#fff') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  download: (size = 16, color = PW_TOKENS.ink) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V15M12 15L7 10M12 15L17 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 19H19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  gallery: (size = 16, color = PW_TOKENS.inkSoft) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.6"/>
      <circle cx="9" cy="10" r="1.6" fill={color}/>
      <path d="M3 17L9 12L14 16L18 13L21 16" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
};

// ──────────────────────────────────────────────────────────────
// Brand wordmark
// ──────────────────────────────────────────────────────────────
function PWBrand({ size = 22, color = PW_TOKENS.ink, animated = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={animated ? 'pw-sparkle-spin' : ''} style={{ display: 'inline-flex' }}>
        {PWIcon.sparkle(Math.round(size * 0.85))}
      </span>
      <span style={{
        fontFamily: 'Inter, system-ui', fontWeight: 600, fontSize: size,
        letterSpacing: -0.4, color, lineHeight: 1,
      }}>Platewise</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Animated aurora background
// ──────────────────────────────────────────────────────────────
function PWAuroraBackground({ accent = PW_TOKENS.green, dense = false }) {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 0,
    }}>
      <div className="pw-aurora pw-aurora-1" style={{ background: accent }}/>
      <div className="pw-aurora pw-aurora-2" style={{ background: '#FFD68A' }}/>
      <div className="pw-aurora pw-aurora-3" style={{ background: '#FF8FA3' }}/>
      {dense && <div className="pw-aurora pw-aurora-4" style={{ background: '#A8C7FF' }}/>}
      <div className="pw-drift pw-drift-1">🌿</div>
      <div className="pw-drift pw-drift-2">✨</div>
      <div className="pw-drift pw-drift-3">🍅</div>
      <div className="pw-drift pw-drift-4">🥑</div>
      <div className="pw-drift pw-drift-5">·</div>
      <div className="pw-grain"/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Loading screen
// ──────────────────────────────────────────────────────────────
function PWLoadingScreen() {
  return (
    <div style={{
      width: '100%', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      gap: 16, background: PW_TOKENS.bg, fontFamily: 'Inter, system-ui',
      position: 'relative', overflow: 'hidden',
    }}>
      <PWAuroraBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="pw-sparkle-spin" style={{ display: 'inline-flex', justifyContent: 'center' }}>
          {PWIcon.sparkle(32, PW_TOKENS.green)}
        </span>
        <div style={{ fontSize: 16, fontWeight: 600, color: PW_TOKENS.ink, letterSpacing: -0.2 }}>
          Analyzing your meal…
        </div>
        <div style={{ fontSize: 13, color: PW_TOKENS.inkSoft }}>
          Claude is estimating your nutrition
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Rotating placeholder hook
// ──────────────────────────────────────────────────────────────
function usePWRotatingPlaceholder(items, intervalMs = 2400) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('in');
  useEffect(() => {
    const t = setInterval(() => {
      setPhase('out');
      setTimeout(() => {
        setI((x) => (x + 1) % items.length);
        setPhase('in');
      }, 280);
    }, intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs]);
  return { text: items[i], phase };
}

// ──────────────────────────────────────────────────────────────
// SCREEN 1: Input
// ──────────────────────────────────────────────────────────────
function PWInputScreen({ state, setState, onAnalyze, onHistory, accent = PW_TOKENS.green, error }) {
  const inputRef = useRef(null);
  const fileRef  = useRef(null);
  const placeholders = ['e.g. Butter Chicken', 'e.g. Avocado Toast', 'e.g. Caesar Salad', 'e.g. Cold brew + oat milk', 'e.g. Margherita pizza'];
  const ph    = usePWRotatingPlaceholder(placeholders, 2600);
  const ready = state.foodName && state.imageBase64;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    try {
      const { base64, mimeType } = await compressImage(f);
      setState((s) => ({ ...s, photo: preview, imageBase64: base64, mimeType }));
    } catch (err) {
      URL.revokeObjectURL(preview);
      setState((s) => ({ ...s, photo: null, imageBase64: null }));
      console.error('Image load error:', err.message);
    }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: PW_TOKENS.bg,
      padding: '40px 28px 48px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 28,
      fontFamily: 'Inter, system-ui', position: 'relative', overflow: 'hidden',
    }}>
      <PWAuroraBackground accent={accent} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 28, flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PWBrand size={26} animated />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={onHistory}
                style={{ background: 'none', border: 'none', fontSize: 13, color: PW_TOKENS.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}
              >History</button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                border: `1px solid ${PW_TOKENS.line}`,
                padding: '5px 10px 5px 8px', borderRadius: 999,
                fontSize: 11.5, fontWeight: 500, color: PW_TOKENS.inkSoft, letterSpacing: -0.1,
              }}>
                <span className="pw-pulse-dot" style={{ background: accent }}></span>
                Ready to scan
              </div>
            </div>
          </div>
          <p style={{
            margin: 0, fontSize: 16, lineHeight: 1.5,
            color: PW_TOKENS.inkSoft, fontWeight: 400, letterSpacing: -0.1,
          }}>Scan any food. <span style={{ color: PW_TOKENS.ink }}>Know what's inside.</span></p>
        </div>

        {/* Input field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontSize: 13, fontWeight: 500, color: PW_TOKENS.inkSoft,
            letterSpacing: 0.2, textTransform: 'uppercase',
          }}>Food name</label>
          <div style={{
            background: '#fff', border: `1px solid ${PW_TOKENS.line}`,
            borderRadius: 16, padding: '16px 18px',
            boxShadow: PW_TOKENS.shadowSoft,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', minHeight: 24 }}>
              <input
                ref={inputRef}
                value={state.foodName}
                onChange={(e) => setState((s) => ({ ...s, foodName: e.target.value }))}
                placeholder=""
                maxLength={80}
                style={{
                  flex: 1, width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'inherit', fontSize: 17, color: PW_TOKENS.ink,
                  letterSpacing: -0.2, position: 'relative', zIndex: 1,
                }}
              />
              {!state.foodName && (
                <span
                  key={ph.text}
                  style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 17, color: PW_TOKENS.inkMute, letterSpacing: -0.2,
                    pointerEvents: 'none',
                    opacity: ph.phase === 'in' ? 1 : 0,
                    transition: 'opacity 0.28s ease, transform 0.28s ease',
                  }}>{ph.text}<span className="pw-caret">|</span></span>
              )}
            </div>
            {state.foodName && (
              <button onClick={() => setState((s) => ({ ...s, foodName: '' }))}
                style={{
                  width: 22, height: 22, borderRadius: 11, border: 'none',
                  background: PW_TOKENS.line, color: PW_TOKENS.inkSoft, cursor: 'pointer',
                  fontSize: 14, lineHeight: 1, padding: 0,
                }}>×</button>
            )}
          </div>
          {/* Suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, color: PW_TOKENS.inkMute, fontWeight: 500,
              letterSpacing: 0.5, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span className="pw-wave">👋</span> try one
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEMO_CHIPS.map((f, i) => (
                <button key={f} onClick={() => setState((s) => ({ ...s, foodName: f }))}
                  style={{
                    background: state.foodName === f ? PW_TOKENS.greenSoft : 'rgba(255,255,255,0.85)',
                    border: `1px solid ${state.foodName === f ? accent : PW_TOKENS.line}`,
                    color: state.foodName === f ? PW_TOKENS.greenInk : PW_TOKENS.inkSoft,
                    fontSize: 12.5, padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s',
                    backdropFilter: 'blur(6px)',
                    animation: `pwChipIn 0.4s ${0.1 + i * 0.08}s both`,
                  }}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary CTA — photo upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()}
            className={!state.photo && state.foodName ? 'pw-cta-pulse' : ''}
            style={{
              background: PW_TOKENS.ink, color: '#fff', border: 'none',
              borderRadius: 999, padding: '18px 24px',
              fontFamily: 'inherit', fontSize: 16, fontWeight: 600, letterSpacing: -0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(20,16,12,0.18)',
              position: 'relative', overflow: 'hidden',
            }}>
            <span className="pw-shine"></span>
            {PWIcon.camera(20)}
            <span>Take Photo or Upload</span>
          </button>
          <p style={{
            margin: 0, fontSize: 13, color: PW_TOKENS.inkMute, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {PWIcon.gallery(14, PW_TOKENS.inkMute)}
            Works with camera or gallery
          </p>
        </div>

        {/* Photo preview + analyze */}
        {state.photo && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            padding: 20, background: '#fff', borderRadius: 20,
            border: `1px solid ${PW_TOKENS.line}`, boxShadow: PW_TOKENS.shadowSoft,
            animation: 'pwFadeUp 0.4s ease',
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img src={state.photo} alt="" style={{
                  width: 120, height: 120, borderRadius: 16, objectFit: 'cover',
                  border: `1px solid ${PW_TOKENS.line}`,
                }} />
                <div style={{
                  position: 'absolute', bottom: -6, right: -6,
                  width: 30, height: 30, borderRadius: 15, background: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(34,197,94,0.35)',
                  border: '2.5px solid #fff',
                }}>{PWIcon.check(14)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: PW_TOKENS.ink }}>Photo ready</div>
                <div style={{ fontSize: 13, color: PW_TOKENS.inkSoft, lineHeight: 1.4 }}>
                  {state.foodName ? `"${state.foodName}"` : 'No food name yet'} —{' '}
                  tap analyze to see the breakdown.
                </div>
              </div>
            </div>
            <button onClick={onAnalyze} disabled={!state.foodName || !state.imageBase64}
              className={ready ? 'pw-analyze-glow' : ''}
              style={{
                background: ready ? accent : '#D9D6D1',
                color: '#fff', border: 'none', borderRadius: 999,
                padding: '16px 24px', fontFamily: 'inherit',
                fontSize: 16, fontWeight: 600, letterSpacing: -0.1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: ready ? 'pointer' : 'not-allowed',
                boxShadow: ready ? '0 6px 20px rgba(34,197,94,0.28)' : 'none',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Analyze</span>
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}>{PWIcon.arrow(16)}</span>
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12,
            padding: '12px 14px', fontSize: 13, color: '#991B1B',
          }}>⚠ {error}</div>
        )}

        <div style={{ flex: 1 }}></div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', fontSize: 11.5, color: PW_TOKENS.inkMute,
          letterSpacing: 0.3, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
        }}>
          <span>Powered by AI, made with</span>
          <span className="pw-heart" style={{ color: '#E25555', fontSize: 12 }}>♥</span>
          <span>by Avi</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Health Score circular badge
// ──────────────────────────────────────────────────────────────
function PWScoreBadge({ score = 7, size = 64 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = score / 10;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill={PW_TOKENS.greenSoft} stroke="none"/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={PW_TOKENS.green} strokeWidth="3.5"
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', lineHeight: 1,
      }}>
        <span style={{
          fontSize: size * 0.32, fontWeight: 700, color: PW_TOKENS.greenInk,
          letterSpacing: -0.5,
        }}>{score}<span style={{ fontSize: size * 0.18, color: PW_TOKENS.greenInk, opacity: 0.6 }}>/10</span></span>
        <span style={{
          fontSize: size * 0.13, color: PW_TOKENS.greenInk,
          fontWeight: 500, marginTop: 3, letterSpacing: 0.4,
          textTransform: 'uppercase', opacity: 0.75,
        }}>Score</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Macro stacked bar — zero-guard prevents NaN and collapsed segments
// ──────────────────────────────────────────────────────────────
function PWMacroBar({ carbs, protein, fat }) {
  const total     = carbs + protein + fat;
  const safeTotal = total || 1; // prevents 0/0 = NaN in percentage labels
  const segs = [
    { label: 'Carbs',   value: carbs,   color: PW_TOKENS.carbs },
    { label: 'Protein', value: protein, color: PW_TOKENS.protein },
    { label: 'Fat',     value: fat,     color: PW_TOKENS.fat },
  ];
  // Minimum visual flex of 2% of total so zero-value segments don't collapse the bar
  const flexFor = (v) => Math.max(v, safeTotal * 0.02);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', width: '100%' }}>
        {segs.map((s, i) => (
          <div key={s.label} style={{
            flex: flexFor(s.value),
            display: 'flex', flexDirection: 'column',
            alignItems: i === 0 ? 'flex-start' : i === segs.length - 1 ? 'flex-end' : 'center',
            gap: 2,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              textTransform: 'uppercase', color: PW_TOKENS.inkMute,
            }}>{s.label}</span>
            <span style={{
              fontSize: 16, fontWeight: 700, color: PW_TOKENS.ink, letterSpacing: -0.3,
            }}>{s.value}<span style={{ fontSize: 11, color: PW_TOKENS.inkSoft, fontWeight: 500, marginLeft: 2 }}>g</span></span>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', width: '100%', height: 14, borderRadius: 999,
        overflow: 'hidden', background: PW_TOKENS.line,
      }}>
        {segs.map((s, i) => (
          <div key={s.label} style={{
            flex: flexFor(s.value), background: s.color,
            borderRight: i < segs.length - 1 ? '2px solid #fff' : 'none',
          }}/>
        ))}
      </div>
      <div style={{ display: 'flex', width: '100%' }}>
        {segs.map((s, i) => (
          <div key={s.label} style={{
            flex: flexFor(s.value),
            textAlign: i === 0 ? 'left' : i === segs.length - 1 ? 'right' : 'center',
            fontSize: 11, color: PW_TOKENS.inkMute, fontWeight: 500,
          }}>{Math.round((s.value / safeTotal) * 100)}%</div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Mineral / fiber pill
// ──────────────────────────────────────────────────────────────
function PWMicroPill({ icon, label, value, unit }) {
  return (
    <div style={{
      flex: 1, background: PW_TOKENS.bg, borderRadius: 14,
      padding: '12px 10px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, border: `1px solid ${PW_TOKENS.line}`,
    }}>
      <div style={{ fontSize: 16, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: PW_TOKENS.inkMute }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: PW_TOKENS.ink, letterSpacing: -0.2 }}>
        {value}<span style={{ fontSize: 11, color: PW_TOKENS.inkSoft, fontWeight: 500, marginLeft: 1 }}>{unit}</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 2: Result Card
// ──────────────────────────────────────────────────────────────
function PWResultCard({ food, onScanAgain, onSaveToLog, onDownload, accent = PW_TOKENS.green, embedded = false, cardRef }) {
  if (!food) return null;
  return (
    <div ref={cardRef} style={{
      background: PW_TOKENS.card,
      borderRadius: 24,
      padding: 24,
      boxShadow: embedded ? PW_TOKENS.shadow : 'none',
      border: `1px solid ${PW_TOKENS.line}`,
      display: 'flex', flexDirection: 'column', gap: 20,
      fontFamily: 'Inter, system-ui',
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Header: name + score */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            {PWIcon.sparkle(12, PW_TOKENS.green)}
            <span style={{ fontSize: 11, fontWeight: 600, color: PW_TOKENS.green, letterSpacing: 0.6, textTransform: 'uppercase' }}>Platewise · Analysis</span>
          </div>
          <h2 style={{
            margin: 0, fontSize: 28, fontWeight: 700, color: PW_TOKENS.ink,
            letterSpacing: -0.8, lineHeight: 1.1,
          }}>{food.name}</h2>
          <div style={{ fontSize: 13, color: PW_TOKENS.inkMute, fontWeight: 500, marginTop: 2 }}>
            {food.serving}
          </div>
        </div>
        <PWScoreBadge score={food.score} size={64} />
      </div>

      {/* Mismatch warning — shown when model flags photo/name mismatch */}
      {food.mismatch && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 12,
          padding: '10px 14px', fontSize: 13, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.45,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span>The photo may not match <strong>"{food.name}"</strong> — nutrition estimate may be less accurate.</span>
        </div>
      )}

      {/* Hero calorie display */}
      <div style={{
        background: PW_TOKENS.bg, borderRadius: 18, padding: '20px 22px',
        display: 'flex', alignItems: 'baseline', gap: 8,
        border: `1px solid ${PW_TOKENS.line}`,
      }}>
        <span style={{
          fontSize: 64, fontWeight: 700, color: PW_TOKENS.ink,
          letterSpacing: -2.5, lineHeight: 0.9,
          fontVariantNumeric: 'tabular-nums',
        }}>{food.kcal}</span>
        <span style={{
          fontSize: 14, fontWeight: 500, color: PW_TOKENS.inkSoft,
          letterSpacing: -0.2,
        }}>kcal</span>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 10.5, color: PW_TOKENS.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Energy</span>
          {/* ÷10 = approx kcal/min at a moderate running pace */}
          <span style={{ fontSize: 12, color: PW_TOKENS.inkSoft, fontWeight: 500 }}>≈ {Math.round(food.kcal / 10)} min run</span>
        </div>
      </div>

      {/* Macro bar */}
      <div style={{ paddingTop: 4 }}>
        <PWMacroBar carbs={food.carbs} protein={food.protein} fat={food.fat} />
      </div>

      {/* Micro pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        <PWMicroPill icon="🌿" label="Fiber"  value={food.fiber}  unit="g"  />
        <PWMicroPill icon="🍬" label="Sugar"  value={food.sugar}  unit="g"  />
        <PWMicroPill icon="🧂" label="Sodium" value={food.sodium} unit="mg" />
      </div>

      <div style={{ height: 1, background: PW_TOKENS.line, margin: '0 -4px' }}></div>

      {/* Did you know */}
      <div style={{
        background: PW_TOKENS.yellowSoft, borderRadius: 16, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: PW_TOKENS.yellowInk,
          letterSpacing: 0.6, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>💡</span> Did you know?
        </div>
        <div style={{
          fontSize: 13.5, lineHeight: 1.55, color: '#574116',
          fontStyle: 'italic', textWrap: 'pretty',
        }}>{food.fact}</div>
      </div>

      {/* Healthier tips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: PW_TOKENS.greenInk,
          letterSpacing: 0.6, textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>✅</span> Healthier Tips
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {food.tips.map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, flexShrink: 0, borderRadius: 11,
                background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginTop: 1,
                boxShadow: '0 1px 3px rgba(34,197,94,0.3)',
              }}>{i + 1}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: PW_TOKENS.ink, flex: 1, textWrap: 'pretty' }}>
                {tip}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Footer brand */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: `1px solid ${PW_TOKENS.line}`,
      }}>
        <PWBrand size={13} color={PW_TOKENS.inkMute} />
        <span style={{ fontSize: 10.5, color: PW_TOKENS.inkMute, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3 }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Action buttons — excluded from PNG capture */}
      <div className="pw-no-export" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button onClick={onSaveToLog} style={{
          background: PW_TOKENS.ink, color: '#fff', border: 'none', borderRadius: 999,
          padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>Save to log</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDownload} style={{
            flex: 1, background: '#fff', color: PW_TOKENS.ink,
            border: `1.5px solid ${PW_TOKENS.line}`, borderRadius: 999,
            padding: '14px 16px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', letterSpacing: -0.1,
          }}>
            {PWIcon.download(15)}
            Download PNG
          </button>
          <button onClick={onScanAgain} style={{
            flex: 1, background: accent, color: '#fff',
            border: 'none', borderRadius: 999,
            padding: '14px 16px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', letterSpacing: -0.1,
            boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
          }}>Scan Another</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 2 wrapper for mobile — uses shared usePngExport hook
// ──────────────────────────────────────────────────────────────
function PWResultScreen({ food, onScanAgain, onSaveToLog, accent = PW_TOKENS.green }) {
  const cardRef               = useRef(null);
  const { onDownload, toast } = usePngExport(cardRef, food);

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: '#F2F0EC',
      padding: '24px 16px 40px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 16,
      fontFamily: 'Inter, system-ui', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
        <button onClick={onScanAgain} style={{
          background: '#fff', border: `1px solid ${PW_TOKENS.line}`,
          width: 40, height: 40, borderRadius: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: PW_TOKENS.ink, padding: 0,
        }}>←</button>
        <PWBrand size={15} color={PW_TOKENS.inkSoft} />
        <div style={{ width: 40 }}></div>
      </div>

      <PWResultCard food={food} onScanAgain={onScanAgain} onSaveToLog={onSaveToLog} onDownload={onDownload} accent={accent} embedded cardRef={cardRef} />

      {toast && (
        <div style={{
          position: 'absolute', bottom: 28, left: 24, right: 24,
          background: PW_TOKENS.ink, color: '#fff',
          padding: '12px 16px', borderRadius: 14,
          fontSize: 13, fontWeight: 500, textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'pwFadeUp 0.3s ease',
        }}>{toast}</div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Desktop wrapper — uses shared usePngExport hook
// ──────────────────────────────────────────────────────────────
function PWDesktopView({ state, setState, food, onAnalyze, onScanAgain, onHistory, onSaveToLog, accent = PW_TOKENS.green, error }) {
  const [howOpenState, setHowOpenState] = useState(false);
  const cardRef               = useRef(null);
  const { onDownload, toast } = usePngExport(cardRef, food);

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: '100vh', background: '#F2F0EC',
      overflowY: 'auto', position: 'relative',
      fontFamily: 'Inter, system-ui',
    }}>
      <div style={{
        height: 60, padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: `1px solid ${PW_TOKENS.line}`,
        background: 'rgba(250,250,249,0.85)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <PWBrand size={18} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onHistory}
            style={{ background: 'none', border: 'none', fontSize: 13, color: PW_TOKENS.inkSoft, cursor: 'pointer', fontFamily: 'inherit' }}
          >History</button>
        <button onClick={() => setHowOpenState(true)} style={{
          background: '#fff', border: `1px solid ${PW_TOKENS.line}`,
          color: PW_TOKENS.ink, borderRadius: 999, padding: '8px 16px',
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
          letterSpacing: -0.1, display: 'inline-flex', alignItems: 'center', gap: 7,
          boxShadow: '0 1px 2px rgba(20,16,12,0.04)', transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = PW_TOKENS.ink; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = PW_TOKENS.ink; }}>
          <span>How it works</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>→</span>
        </button>
        </div>
      </div>

      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '36px 24px 48px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {!food ? (
          <PWInputScreen state={state} setState={setState} onAnalyze={onAnalyze} accent={accent} error={error} />
        ) : (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={onScanAgain} style={{
                background: '#fff', border: `1px solid ${PW_TOKENS.line}`,
                borderRadius: 999, padding: '8px 14px', fontSize: 13, color: PW_TOKENS.inkSoft,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}>← Back</button>
              <span style={{ fontSize: 12, color: PW_TOKENS.inkMute, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase' }}>Result</span>
            </div>
            <PWResultCard food={food} onScanAgain={onScanAgain} onSaveToLog={onSaveToLog} onDownload={onDownload} accent={accent} embedded cardRef={cardRef} />
          </React.Fragment>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: PW_TOKENS.ink, color: '#fff',
          padding: '12px 18px', borderRadius: 14,
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100,
        }}>{toast}</div>
      )}

      {howOpenState && <PWHowItWorks onClose={() => setHowOpenState(false)} accent={accent} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// "How it works" modal
// ──────────────────────────────────────────────────────────────
function PWHowItWorks({ onClose, accent = PW_TOKENS.green }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const steps = [
    { n: '01', t: 'Name your dish', d: 'Type what you\'re eating — "Butter Chicken", "Avocado Toast", a coffee order. The more specific you are, the more accurate the breakdown.' },
    { n: '02', t: 'Add a photo', d: 'Snap the plate or pull one from your gallery. The image is compressed client-side to 600px and converted to JPEG before being sent.' },
    { n: '03', t: 'Tap Analyze', d: 'Platewise estimates calories, macros (carbs, protein, fat) and key micros (fiber, sugar, sodium) — and grades the dish from 1 to 10.' },
    { n: '04', t: 'Read the card', d: 'A premium nutrition infographic with a hero calorie number, a stacked macro bar, fun food trivia, and three concrete swaps to make the meal healthier.' },
    { n: '05', t: 'Save or share', d: 'Download the card as a PNG to drop in your journal, or tap "Scan Another" and keep going.' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(20,16,12,0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'pwFadeUp 0.25s ease',
      fontFamily: 'Inter, system-ui',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 540,
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        animation: 'pwScaleIn 0.3s cubic-bezier(.2,.9,.3,1.1)',
        position: 'relative',
      }}>
        <div style={{
          padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: accent,
              letterSpacing: 0.6, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span className="pw-sparkle-spin" style={{ display: 'inline-flex' }}>
                {PWIcon.sparkle(12, accent)}
              </span>
              How Platewise works
            </span>
            <h2 style={{
              margin: 0, fontSize: 26, fontWeight: 700, color: PW_TOKENS.ink,
              letterSpacing: -0.8, lineHeight: 1.15,
            }}>From plate to nutrition card<br/>in five seconds.</h2>
            <p style={{
              margin: '6px 0 0', fontSize: 14, lineHeight: 1.55,
              color: PW_TOKENS.inkSoft, textWrap: 'pretty',
            }}>
              Platewise turns any meal — home-cooked, restaurant, or packaged —
              into a clean, shareable infographic with calories, macros, and
              practical tips, powered by Claude vision.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 16, border: `1px solid ${PW_TOKENS.line}`,
            background: '#fff', cursor: 'pointer', flexShrink: 0,
            color: PW_TOKENS.inkSoft, fontSize: 16, lineHeight: 1, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((s) => (
            <div key={s.n} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '14px 16px', borderRadius: 14,
              background: PW_TOKENS.bg, border: `1px solid ${PW_TOKENS.line}`,
            }}>
              <div style={{
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontSize: 11, fontWeight: 700, color: accent,
                background: '#fff', border: `1px solid ${PW_TOKENS.line}`,
                padding: '4px 8px', borderRadius: 8, flexShrink: 0,
                letterSpacing: 0.4, marginTop: 2,
              }}>{s.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14.5, fontWeight: 600, color: PW_TOKENS.ink,
                  letterSpacing: -0.2, marginBottom: 3,
                }}>{s.t}</div>
                <div style={{
                  fontSize: 13, lineHeight: 1.55, color: PW_TOKENS.inkSoft,
                  textWrap: 'pretty',
                }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '0 28px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 11.5, color: PW_TOKENS.inkMute, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Powered by AI · made with</span>
            <span className="pw-heart" style={{ color: '#E25555' }}>♥</span>
            <span>by Avi</span>
          </div>
          <button onClick={onClose} style={{
            background: accent, color: '#fff', border: 'none',
            borderRadius: 999, padding: '10px 18px',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            cursor: 'pointer', letterSpacing: -0.1,
            boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
          }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Root App — responsive, wired to /api/analyze
// ──────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState]       = useState({ foodName: '', photo: null, imageBase64: null, mimeType: 'image/jpeg' });
  const [food, setFood]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [authed, setAuthed]     = useState(null);   // null = checking, true/false once known
  const [view, setView]         = useState('scan'); // 'scan' | 'history'

  // Session-scoped dedup cache — identical name+image combos skip the API call
  const scanCache = useRef(new Map());

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  const onAnalyze = async () => {
    if (!state.foodName || !state.imageBase64) return;

    // Dedup: key on normalised name + first 64 chars of base64
    const cacheKey = `${state.foodName.trim().toLowerCase()}::${state.imageBase64.slice(0, 64)}`;
    if (scanCache.current.has(cacheKey)) {
      setFood(scanCache.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.foodName, imageBase64: state.imageBase64, mimeType: state.mimeType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const foodData = {
        name:     data.name,
        serving:  data.serving,
        score:    data.healthScore,
        kcal:     data.calories,
        carbs:    data.macros.carbs,
        protein:  data.macros.protein,
        fat:      data.macros.fat,
        fiber:    data.other.fiber,
        sugar:    data.other.sugar,
        sodium:   data.other.sodium,
        fact:     data.fact,
        tips:     data.tips,
        mismatch: data.mismatch,
      };
      scanCache.current.set(cacheKey, foodData);
      setFood(foodData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onScanAgain = () => {
    setFood(null);
    setError(null);
    setState({ foodName: '', photo: null, imageBase64: null, mimeType: 'image/jpeg' });
  };

  const onSaveToLog = async () => {
    if (!food) return;
    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: food.name,
          serving: food.serving,
          calories: food.kcal,
          macros: { carbs: food.carbs, protein: food.protein, fat: food.fat },
          other: { fiber: food.fiber, sugar: food.sugar, sodium: food.sodium },
          healthScore: food.score,
          fact: food.fact,
          tips: food.tips,
          mismatch: food.mismatch,
          imageBase64: state.imageBase64,
          mimeType: state.mimeType,
        }),
      });
      onScanAgain();
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  if (authed === null) return null;
  if (authed === false) return <PWLock onUnlock={() => setAuthed(true)} />;
  if (view === 'history') return <PWHistory onBack={() => setView('scan')} />;

  if (loading) return <PWLoadingScreen />;

  if (isMobile) {
    return food
      ? <PWResultScreen food={food} onScanAgain={onScanAgain} onSaveToLog={onSaveToLog} />
      : <PWInputScreen  state={state} setState={setState} onAnalyze={onAnalyze} onHistory={() => setView('history')} error={error} />;
  }

  return (
    <PWDesktopView
      state={state}
      setState={setState}
      food={food}
      onAnalyze={onAnalyze}
      onScanAgain={onScanAgain}
      onHistory={() => setView('history')}
      onSaveToLog={onSaveToLog}
      error={error}
    />
  );
}
