import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, MACRO_COLORS } from '../tokens.jsx';
import PlateArt from '../ui/PlateArt.jsx';
import PWButton from '../ui/PWButton.jsx';

const ADVANTAGES = [
  { icon: '👁️', title: 'See the pattern', desc: 'One meal tells you nothing. Thirty meals tell you everything about how you actually eat.' },
  { icon: '📐', title: 'Replace guessing', desc: '"Probably around 500 calories" becomes an actual number, every time, without a kitchen scale.' },
  { icon: '⏱️', title: 'Catch drift early', desc: 'Weight and energy shifts show up in your numbers weeks before they show up on a scale.' },
  { icon: '🔁', title: 'Small swaps compound', desc: 'Knowing one dish is 200 calories heavier than you thought changes tomorrow’s plate, not just today’s.' },
];

const FEATURES = [
  { icon: '📸', title: 'Photo to nutrition', desc: 'A single photo returns calories, macros, fibre and sodium, broken down ingredient by ingredient.' },
  { icon: '🎯', title: 'Targets that fit you', desc: 'Onboarding builds a daily calorie and macro goal from your body and your goal. Adjust it anytime.' },
  { icon: '📊', title: 'A real food diary', desc: 'Today, weekly history, and a saved library so logging a repeat meal takes one tap.' },
];

const SHORT_QUOTES = [
  { text: 'You can’t out-train a bad diet.', src: 'Everyday gym wisdom' },
  { text: 'What you eat today is walking and talking tomorrow.', src: 'Old kitchen saying' },
  { text: 'The meal you don’t track is the meal you don’t understand.', src: 'Platewise, on repeat' },
];

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function WaitlistForm({ idPrefix, dark }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | alreadyOnList
  const [errorMsg, setErrorMsg] = useState('');

  const valid = isValidEmail(email);

  async function handleJoin(e) {
    e.preventDefault();
    if (!valid) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const r = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Something went wrong');
        return;
      }
      setStatus(data.alreadyOnList ? 'alreadyOnList' : 'success');
    } catch {
      setStatus('error');
      setErrorMsg('Network error, please try again');
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        background: dark ? 'rgba(78,127,69,0.18)' : T.tint,
        border: `1px solid ${dark ? 'rgba(78,127,69,0.4)' : '#cfe3c8'}`,
        borderRadius: 16, padding: '20px 22px', maxWidth: 420, margin: '0 auto', textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: dark ? '#fff' : T.sageInk, marginBottom: 4 }}>
          You're on the list
        </div>
        <div style={{ fontSize: 15, color: dark ? 'rgba(255,255,255,0.8)' : T.inkSoft }}>
          We'll email <b>{email}</b> the moment your spot opens.
        </div>
      </div>
    );
  }
  if (status === 'alreadyOnList') {
    return (
      <div style={{
        background: T.tint, border: `1px solid ${T.inkSoft}`, borderRadius: 16,
        padding: '16px 22px', maxWidth: 420, margin: '0 auto', color: T.inkSoft, fontSize: 15, fontWeight: 600,
      }}>
        You're already on the waitlist. We'll be in touch!
      </div>
    );
  }

  return (
    <form onSubmit={handleJoin} style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com *"
          aria-label="Email address"
          required
          style={{
            flex: '1 1 220px', minWidth: 0, height: 56,
            padding: '0 18px', borderRadius: T.rInput, boxSizing: 'border-box',
            border: `1.5px solid ${status === 'error' ? T.danger : 'transparent'}`,
            background: dark ? 'rgba(255,255,255,0.1)' : '#fff',
            color: dark ? '#fff' : T.ink,
            fontSize: 16, fontFamily: T.fontBody, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!valid || status === 'loading'}
          style={{
            height: 56, background: dark ? '#fff' : T.ink, color: dark ? T.ink : T.onAccent,
            border: 'none', borderRadius: 28, padding: '0 26px', fontSize: 17, fontWeight: 600,
            cursor: !valid || status === 'loading' ? 'not-allowed' : 'pointer',
            fontFamily: T.fontBody, whiteSpace: 'nowrap', flex: '0 0 auto',
            opacity: !valid || status === 'loading' ? 0.55 : 1,
          }}
        >
          {status === 'loading' ? 'Joining…' : 'Request access'}
        </button>
      </div>
      <div style={{
        fontSize: 14, color: dark ? '#F3B4A6' : T.danger, marginTop: 8, minHeight: 14, textAlign: 'left',
      }}>
        {status === 'error' ? errorMsg : (email && !valid ? 'Enter a valid email to continue' : '')}
      </div>
    </form>
  );
}

function QuoteBand({ dark, quote, sub }) {
  return (
    <div style={{
      padding: '74px 24px', textAlign: 'center',
      background: dark ? T.ink : 'transparent', color: dark ? '#fff' : T.ink,
    }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 54, lineHeight: 1, color: T.ink, marginBottom: 6 }}>&ldquo;</div>
      <blockquote style={{
        fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1.28,
        letterSpacing: '-0.01em', maxWidth: 760, margin: '0 auto',
      }}>
        {quote}
      </blockquote>
      {sub && (
        <div style={{
          fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: dark ? 'rgba(255,255,255,0.7)' : T.inkMute, marginTop: 18,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniShot({ children, label }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadowSoft,
      width: 200, padding: 16,
    }}>
      {children}
      {label && <div style={{ fontSize: 13, color: T.inkMute, marginTop: 9 }}>{label}</div>}
    </div>
  );
}

export default function PWLanding() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.ink }}>

      {/* Welcome */}
      <div style={{ background: T.tint, padding: '28px 24px 52px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 24 }}>Platewise</div>

          <div aria-hidden="true" style={{ position: 'relative', height: 250, maxWidth: 360, margin: '18px auto 8px' }}>
            <PlateArt kind="chai" size={130} style={{ position: 'absolute', left: 0, top: 70 }} />
            <PlateArt kind="poha" size={150} style={{ position: 'absolute', right: 0, top: 80 }} />
            <PlateArt kind="thali" size={210} style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', filter: 'drop-shadow(0 18px 18px rgba(23,54,42,0.18))' }} />
          </div>

          <h1 style={{
            fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 'clamp(36px, 8vw, 44px)',
            lineHeight: 1.1, margin: '0 auto', maxWidth: 520,
          }}>
            Know what's on your plate.
          </h1>
          <p style={{ fontSize: 17, color: T.inkSoft, maxWidth: 520, margin: '16px auto 0', lineHeight: 1.55 }}>
            Snap a meal and get calories, macros and an itemised ingredient breakdown in seconds.
            No weighing, no database hunting, no guesswork.
          </p>
          <div style={{ marginTop: 28 }}>
            <WaitlistForm idPrefix="hero" />
          </div>
          <div style={{ marginTop: 6 }}>
            <PWButton variant="secondary" onClick={() => navigate('/login')} style={{ background: 'transparent' }}>Sign in</PWButton>
          </div>
          <div style={{ marginTop: 16, fontSize: 14, color: T.inkSoft }}>Private beta, invite only</div>
        </div>
      </div>

      {/* Screenshot strip */}
      <div style={{
        padding: '10px 24px 50px', display: 'flex', gap: 18, justifyContent: 'center',
        alignItems: 'flex-end', flexWrap: 'wrap', maxWidth: 1040, margin: '0 auto',
      }}>
        <MiniShot>
          <div style={{
            height: 74, margin: -16, marginBottom: 12, borderRadius: '18px 18px 0 0',
            background: `linear-gradient(135deg, #E8A87C, ${T.ink})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🍛</div>
          <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 13.5, }}>Butter Chicken</b>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '6px 0 9px' }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink }}>512</span>
            <span style={{ fontSize: 13, color: T.inkMute }}>kcal</span>
          </div>
          <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ flex: 3, background: MACRO_COLORS.carbs }} />
            <div style={{ flex: 4, background: MACRO_COLORS.protein }} />
            <div style={{ flex: 2, background: MACRO_COLORS.fat }} />
          </div>
        </MiniShot>

        <MiniShot>
          <div style={{ textAlign: 'center' }}>
            <svg width="84" height="84" viewBox="0 0 92 92" style={{ marginBottom: 4 }}>
              <circle cx="46" cy="46" r="38" fill="none" stroke={T.line} strokeWidth="9" />
              <circle cx="46" cy="46" r="38" fill="none" stroke={T.ink} strokeWidth="9" strokeLinecap="round"
                strokeDasharray="239" strokeDashoffset="70" transform="rotate(-90 46 46)" />
            </svg>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 20, }}>
              1,420 <span style={{ fontSize: 13, color: T.inkMute, fontFamily: T.fontBody }}>/ 2,050</span>
            </div>
            <div style={{ fontSize: 13, color: T.inkMute, marginTop: 2 }}>calories today</div>
          </div>
        </MiniShot>

        <MiniShot label="Wk 1 → on target by Wk 4">
          <div style={{ fontSize: 13, fontWeight: 600, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            4-week calorie trend
          </div>
          <svg width="100%" height="58" viewBox="0 0 198 58" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="198" y2="30" stroke={T.line} strokeWidth="1" strokeDasharray="3,3" />
            <polyline points="0,46 28,40 56,42 84,30 112,26 140,18 168,14 198,10" fill="none"
              stroke={T.sage} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </MiniShot>

        <MiniShot label="Consistency, visualised">
          <div style={{ fontSize: 13, fontWeight: 600, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            21-day streak
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} style={{
                background: [5, 16].includes(i) ? T.line : T.sage, height: 13, borderRadius: 3,
              }} />
            ))}
          </div>
        </MiniShot>
      </div>

      <QuoteBand
        dark
        quote={<>If you could trade your money for health,<br />would you do it?</>}
        sub="Most people already do. They just don't see the trade happening"
      />

      {/* Why this works */}
      <div style={{ padding: '60px 24px 20px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 36px' }}>
          <div style={{
            display: 'inline-flex', background: T.tint, color: T.ink, borderRadius: 999,
            padding: '5px 11px', fontSize: 13, fontWeight: 600, fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', marginBottom: 16,
          }}>
            Why this works
          </div>
          <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 30, }}>
            Food is the input. Everything else is the output.
          </h2>
          <p style={{ fontSize: 16, color: T.inkSoft, marginTop: 12, lineHeight: 1.6 }}>
            Sleep, energy, weight, mood, skin, focus: almost all of it traces back to what's on the plate.
            You can't fix what you don't measure, and most people have never actually seen their own diet in numbers.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {ADVANTAGES.map((a) => (
            <div key={a.title} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 22, boxShadow: T.shadowSoft }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: T.tint,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, marginBottom: 14,
              }}>{a.icon}</div>
              <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 15.5, display: 'block', marginBottom: 6 }}>{a.title}</b>
              <p style={{ fontSize: 15, color: T.inkSoft, lineHeight: 1.55 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot deep-dive */}
      <div style={{ padding: '50px 24px', maxWidth: 940, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 32px' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 26, }}>
            What you'll actually see
          </h2>
          <p style={{ fontSize: 15, color: T.inkSoft, marginTop: 10 }}>
            Real screens from the app, not mockups of a mockup.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadowSoft, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.tint}, ${T.bg})`, display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="110" height="110" viewBox="0 0 92 92" style={{ marginBottom: 6 }}>
                  <circle cx="46" cy="46" r="38" fill="none" stroke={T.line} strokeWidth="9" />
                  <circle cx="46" cy="46" r="38" fill="none" stroke={T.ink} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray="239" strokeDashoffset="70" transform="rotate(-90 46 46)" />
                </svg>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 19, }}>1,420 / 2,050</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  <span style={{ background: T.tint, color: T.ink, fontSize: 13, fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', borderRadius: 999, padding: '3px 8px' }}>C 142g</span>
                  <span style={{ background: T.tint, color: T.sageInk, fontSize: 13, fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', borderRadius: 999, padding: '3px 8px' }}>P 88g</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.line}` }}>
              <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 16, display: 'block', marginBottom: 3 }}>Today</b>
              <span style={{ fontSize: 13, color: T.inkMute }}>Calories left, macro targets and your plates for the day</span>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadowSoft, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.tint}, ${T.bg})` }}>
              <svg width="100%" height="110" viewBox="0 0 240 110" preserveAspectRatio="none">
                <line x1="0" y1="55" x2="240" y2="55" stroke={T.inkFaint} strokeWidth="1" strokeDasharray="4,4" />
                <text x="4" y="50" fontSize="13" fill="#5E6F64" fontFamily="Hanken Grotesk, sans-serif">target</text>
                <polyline points="0,90 30,82 60,86 90,60 120,64 150,42 180,48 210,28 240,24" fill="none"
                  stroke={T.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.line}` }}>
              <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 14, display: 'block', marginBottom: 3 }}>Weekly trend</b>
              <span style={{ fontSize: 13, color: T.inkMute }}>Calories over time, plotted against your target line</span>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadowSoft, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.tint}, ${T.bg})` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Chicken thigh · 220g', '312 kcal'],
                  ['Cream & butter · 40g', '180 kcal'],
                  ['Tomato gravy · 90g', '72 kcal'],
                  ['Cashew paste · 15g', '88 kcal'],
                ].map(([n, c]) => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{n}</span>
                    <span style={{ fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', color: T.inkMute }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.line}` }}>
              <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 14, display: 'block', marginBottom: 3 }}>Ingredient breakdown</b>
              <span style={{ fontSize: 13, color: T.inkMute }}>One photo, itemised down to the cashew paste</span>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadowSoft, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.goldTint}, ${T.bg})` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['🥗', 'Greek salad', '310'],
                  ['🍜', 'Veg ramen', '540'],
                  ['🍳', 'Masala omelette', '260'],
                ].map(([icon, n, c]) => (
                  <div key={n} style={{
                    display: 'flex', alignItems: 'center', gap: 10, background: T.surface,
                    border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 11px',
                  }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{n}</span>
                    <span style={{ fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: T.inkMute }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.line}` }}>
              <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 14, display: 'block', marginBottom: 3 }}>Saved library</b>
              <span style={{ fontSize: 13, color: T.inkMute }}>Log a repeat meal in one tap, no re-photographing</span>
            </div>
          </div>

        </div>
      </div>

      {/* Short quote row */}
      <div style={{ padding: '10px 24px 56px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {SHORT_QUOTES.map((q) => (
            <div key={q.src} style={{ background: T.tint, border: `1px solid ${T.tint}`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontFamily: T.fontDisplay, fontSize: 18, lineHeight: 1.4, color: T.ink }}>
                &ldquo;{q.text}&rdquo;
              </p>
              <span style={{ fontSize: 13, color: T.inkMute, fontFamily: T.fontBody, fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10, display: 'block' }}>
                {q.src}
              </span>
            </div>
          ))}
        </div>
      </div>

      <QuoteBand quote={<>Every plate is a decision.<br />Make it a visible one.</>} />

      {/* Features */}
      <div style={{ padding: '50px 24px 56px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22, maxWidth: 880, margin: '0 auto' }}>
        {FEATURES.map((f) => (
          <div key={f.title}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
            <b style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 16, display: 'block', marginBottom: 6 }}>{f.title}</b>
            <p style={{ fontSize: 15, color: T.inkSoft, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '54px 24px', textAlign: 'center', background: T.ink, color: '#fff' }}>
        <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 'normal', fontSize: 28, }}>Want in?</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, margin: '10px 0 24px' }}>
          Drop your email and we'll save you a place in the beta.
        </p>
        <WaitlistForm idPrefix="footer" dark />
      </div>

    </div>
  );
}
