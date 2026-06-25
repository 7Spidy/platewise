import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';

const ADVANTAGES = [
  { icon: '👁️', title: 'See the pattern', desc: 'One meal tells you nothing. Thirty meals tell you everything about how you actually eat.' },
  { icon: '📐', title: 'Replace guessing', desc: '"Probably around 500 calories" becomes an actual number, every time, without a kitchen scale.' },
  { icon: '⏱️', title: 'Catch drift early', desc: 'Weight and energy shifts show up in your numbers weeks before they show up on a scale.' },
  { icon: '🔁', title: 'Small swaps compound', desc: 'Knowing one dish is 200 calories heavier than you thought changes tomorrow’s plate, not just today’s.' },
];

const FEATURES = [
  { icon: '📸', title: 'Photo to nutrition', desc: 'A single photo returns calories, macros, fibre and sodium, broken down ingredient by ingredient.' },
  { icon: '🎯', title: 'Targets that fit you', desc: 'Onboarding builds a daily calorie and macro goal from your body and your goal. Adjust it anytime.' },
  { icon: '📊', title: 'A real food diary', desc: 'Dashboard, weekly history, and a saved library so logging a repeat meal takes one tap.' },
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
        background: dark ? 'rgba(92,138,80,0.18)' : T.sageSoft,
        border: `1px solid ${dark ? 'rgba(92,138,80,0.4)' : '#cfe3c8'}`,
        borderRadius: 16, padding: '20px 22px', maxWidth: 420, margin: '0 auto', textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: dark ? '#fff' : T.sage, marginBottom: 4 }}>
          ✓ You're on the list
        </div>
        <div style={{ fontSize: 12.5, color: dark ? '#D9C9BA' : T.inkSoft }}>
          We'll email <b>{email}</b> the moment your spot opens.
        </div>
      </div>
    );
  }
  if (status === 'alreadyOnList') {
    return (
      <div style={{
        background: T.blue50, border: `1px solid ${T.blue}`, borderRadius: 16,
        padding: '16px 22px', maxWidth: 420, margin: '0 auto', color: T.blue, fontSize: 14, fontWeight: 600,
      }}>
        You're already on the waitlist. We'll be in touch!
      </div>
    );
  }

  return (
    <form onSubmit={handleJoin} style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com *"
          required
          style={{
            flex: 1, minWidth: 0,
            padding: '15px 16px', borderRadius: 14,
            border: `1.5px solid ${status === 'error' ? T.red : T.line}`,
            background: dark ? 'rgba(255,255,255,0.07)' : T.card,
            borderColor: dark ? 'rgba(255,255,255,0.18)' : (status === 'error' ? T.red : T.line),
            color: dark ? '#fff' : T.ink,
            fontSize: 15, fontFamily: T.font, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!valid || status === 'loading'}
          style={{
            background: !valid || status === 'loading' ? T.inkFaint : T.green,
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '15px 22px', fontSize: 15, fontWeight: 600,
            cursor: !valid || status === 'loading' ? 'not-allowed' : 'pointer',
            fontFamily: T.font, whiteSpace: 'nowrap',
            boxShadow: !valid || status === 'loading' ? 'none' : '0 6px 20px rgba(196,103,74,0.32)',
            opacity: status === 'loading' ? 0.7 : 1,
          }}
        >
          {status === 'loading' ? 'Joining…' : 'Request access'}
        </button>
      </div>
      <div style={{
        fontSize: 12, color: dark ? '#FCA5A5' : T.red, marginTop: 8, minHeight: 14, textAlign: 'left',
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
      <div style={{ fontFamily: T.heading, fontSize: 54, lineHeight: 1, color: T.green, marginBottom: 6 }}>&ldquo;</div>
      <blockquote style={{
        fontFamily: T.heading, fontWeight: 500, fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1.28,
        letterSpacing: '-0.01em', maxWidth: 760, margin: '0 auto',
      }}>
        {quote}
      </blockquote>
      {sub && (
        <div style={{
          fontFamily: T.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: dark ? '#9A7A66' : T.inkMute, marginTop: 18,
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
      background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadow,
      width: 200, padding: 16,
    }}>
      {children}
      {label && <div style={{ fontSize: 10.5, color: T.inkMute, marginTop: 9 }}>{label}</div>}
    </div>
  );
}

export default function PWLanding() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.ink }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, background: T.bg, borderBottom: `1px solid ${T.lineSoft}`, zIndex: 10,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1040, margin: '0 auto',
      }}>
        <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>Platewise</div>
        <button onClick={() => navigate('/login')} style={{
          background: 'none', border: 'none', color: T.green, fontWeight: 600, fontSize: 14,
          cursor: 'pointer', fontFamily: T.font,
        }}>
          Get early access →
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 720, margin: '0 auto', padding: '60px 24px 46px', textAlign: 'center',
        background: `radial-gradient(120% 90% at 50% -10%, ${T.greenSoft} 0%, ${T.bg} 55%)`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, background: T.sageSoft, color: T.sage,
          borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 600, fontFamily: T.mono,
          letterSpacing: '0.02em', marginBottom: 22,
        }}>
          ◆ Private beta · invite only
        </div>
        <h1 style={{
          fontFamily: T.heading, fontSize: 'clamp(32px, 6vw, 50px)', fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 auto',
        }}>
          Photograph your plate.<br />Know what's on it.
        </h1>
        <p style={{ fontSize: 17.5, color: T.inkSoft, maxWidth: 540, margin: '20px auto 0', lineHeight: 1.6 }}>
          Snap a meal and get calories, macros, and an itemised ingredient breakdown in seconds.
          No weighing, no database hunting, no guesswork.
        </p>
        <div style={{ marginTop: 34 }}>
          <WaitlistForm idPrefix="hero" />
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
            background: `linear-gradient(135deg, #E8A87C, ${T.green})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🍛</div>
          <b style={{ fontFamily: T.heading, fontSize: 13.5, fontWeight: 600 }}>Butter Chicken</b>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '6px 0 9px' }}>
            <span style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 600, color: T.green }}>512</span>
            <span style={{ fontSize: 10, color: T.inkMute }}>kcal</span>
          </div>
          <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ flex: 3, background: T.carbs }} />
            <div style={{ flex: 4, background: T.protein }} />
            <div style={{ flex: 2, background: T.fat }} />
          </div>
        </MiniShot>

        <MiniShot>
          <div style={{ textAlign: 'center' }}>
            <svg width="84" height="84" viewBox="0 0 92 92" style={{ marginBottom: 4 }}>
              <circle cx="46" cy="46" r="38" fill="none" stroke={T.lineSoft} strokeWidth="9" />
              <circle cx="46" cy="46" r="38" fill="none" stroke={T.green} strokeWidth="9" strokeLinecap="round"
                strokeDasharray="239" strokeDashoffset="70" transform="rotate(-90 46 46)" />
            </svg>
            <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 600 }}>
              1,420 <span style={{ fontSize: 11, color: T.inkMute, fontFamily: T.font }}>/ 2,050</span>
            </div>
            <div style={{ fontSize: 10.5, color: T.inkMute, marginTop: 2 }}>calories today</div>
          </div>
        </MiniShot>

        <MiniShot label="Wk 1 → on target by Wk 4">
          <div style={{ fontSize: 10.5, fontWeight: 600, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            4-week calorie trend
          </div>
          <svg width="100%" height="58" viewBox="0 0 198 58" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="198" y2="30" stroke={T.lineSoft} strokeWidth="1" strokeDasharray="3,3" />
            <polyline points="0,46 28,40 56,42 84,30 112,26 140,18 168,14 198,10" fill="none"
              stroke={T.sage} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </MiniShot>

        <MiniShot label="Consistency, visualised">
          <div style={{ fontSize: 10.5, fontWeight: 600, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            21-day streak
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} style={{
                background: [5, 16].includes(i) ? T.lineSoft : T.sage, height: 13, borderRadius: 3,
              }} />
            ))}
          </div>
        </MiniShot>
      </div>

      <QuoteBand
        dark
        quote={<>If you could trade your money for health,<br />would you do it?</>}
        sub="Most people already do — they just don't see the trade happening"
      />

      {/* Why this works */}
      <div style={{ padding: '60px 24px 20px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 36px' }}>
          <div style={{
            display: 'inline-flex', background: T.greenSoft, color: T.green, borderRadius: 999,
            padding: '5px 11px', fontSize: 11, fontWeight: 600, fontFamily: T.mono, marginBottom: 16,
          }}>
            Why this works
          </div>
          <h2 style={{ fontFamily: T.heading, fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em' }}>
            Food is the input. Everything else is the output.
          </h2>
          <p style={{ fontSize: 14.5, color: T.inkSoft, marginTop: 12, lineHeight: 1.6 }}>
            Sleep, energy, weight, mood, skin, focus — almost all of it traces back to what's on the plate.
            You can't fix what you don't measure, and most people have never actually seen their own diet in numbers.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {ADVANTAGES.map((a) => (
            <div key={a.title} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 22, boxShadow: T.shadowSoft }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: T.greenSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, marginBottom: 14,
              }}>{a.icon}</div>
              <b style={{ fontFamily: T.heading, fontSize: 15.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>{a.title}</b>
              <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot deep-dive */}
      <div style={{ padding: '50px 24px', maxWidth: 940, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 32px' }}>
          <h2 style={{ fontFamily: T.heading, fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em' }}>
            What you'll actually see
          </h2>
          <p style={{ fontSize: 14, color: T.inkSoft, marginTop: 10 }}>
            Real screens from the app, not mockups of a mockup.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.greenSoft}, ${T.bg})`, display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="110" height="110" viewBox="0 0 92 92" style={{ marginBottom: 6 }}>
                  <circle cx="46" cy="46" r="38" fill="none" stroke={T.lineSoft} strokeWidth="9" />
                  <circle cx="46" cy="46" r="38" fill="none" stroke={T.green} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray="239" strokeDashoffset="70" transform="rotate(-90 46 46)" />
                </svg>
                <div style={{ fontFamily: T.heading, fontSize: 19, fontWeight: 600 }}>1,420 / 2,050</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  <span style={{ background: T.greenSoft, color: T.green, fontSize: 9, fontFamily: T.mono, borderRadius: 999, padding: '3px 8px' }}>C 142g</span>
                  <span style={{ background: T.sageSoft, color: T.sage, fontSize: 9, fontFamily: T.mono, borderRadius: 999, padding: '3px 8px' }}>P 88g</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.lineSoft}` }}>
              <b style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 3 }}>Dashboard</b>
              <span style={{ fontSize: 12, color: T.inkMute }}>Today's ring, macro pills, meal-by-meal breakdown</span>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.sageSoft}, ${T.bg})` }}>
              <svg width="100%" height="110" viewBox="0 0 240 110" preserveAspectRatio="none">
                <line x1="0" y1="55" x2="240" y2="55" stroke={T.inkFaint} strokeWidth="1" strokeDasharray="4,4" />
                <text x="4" y="50" fontSize="9" fill="#9A7A66" fontFamily="DM Mono, monospace">target</text>
                <polyline points="0,90 30,82 60,86 90,60 120,64 150,42 180,48 210,28 240,24" fill="none"
                  stroke={T.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.lineSoft}` }}>
              <b style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 3 }}>Weekly trend</b>
              <span style={{ fontSize: 12, color: T.inkMute }}>Calories over time, plotted against your target line</span>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.greenSoft}, ${T.bg})` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Chicken thigh · 220g', '312 kcal'],
                  ['Cream & butter · 40g', '180 kcal'],
                  ['Tomato gravy · 90g', '72 kcal'],
                  ['Cashew paste · 15g', '88 kcal'],
                ].map(([n, c]) => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span>{n}</span>
                    <span style={{ fontFamily: T.mono, color: T.inkMute }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.lineSoft}` }}>
              <b style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 3 }}>Ingredient breakdown</b>
              <span style={{ fontSize: 12, color: T.inkMute }}>One photo, itemised down to the cashew paste</span>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: `linear-gradient(160deg, ${T.amber50}, ${T.bg})` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['🥗', 'Greek salad', '310'],
                  ['🍜', 'Veg ramen', '540'],
                  ['🍳', 'Masala omelette', '260'],
                ].map(([icon, n, c]) => (
                  <div key={n} style={{
                    display: 'flex', alignItems: 'center', gap: 10, background: T.card,
                    border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 11px',
                  }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{n}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMute }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.lineSoft}` }}>
              <b style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 3 }}>Saved library</b>
              <span style={{ fontSize: 12, color: T.inkMute }}>Log a repeat meal in one tap, no re-photographing</span>
            </div>
          </div>

        </div>
      </div>

      {/* Short quote row */}
      <div style={{ padding: '10px 24px 56px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {SHORT_QUOTES.map((q) => (
            <div key={q.src} style={{ background: T.green50, border: `1px solid ${T.greenSoft}`, borderRadius: 16, padding: 22 }}>
              <p style={{ fontFamily: T.heading, fontSize: 16.5, fontWeight: 500, lineHeight: 1.4, color: T.greenInk }}>
                &ldquo;{q.text}&rdquo;
              </p>
              <span style={{ fontSize: 11, color: T.inkMute, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10, display: 'block' }}>
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
            <b style={{ fontFamily: T.heading, fontSize: 16, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.title}</b>
            <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '54px 24px', textAlign: 'center', background: T.ink, color: '#fff' }}>
        <h2 style={{ fontFamily: T.heading, fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em' }}>Want in?</h2>
        <p style={{ color: '#D9C9BA', fontSize: 14.5, margin: '10px 0 24px' }}>
          Drop your email and we'll save you a place in the beta.
        </p>
        <WaitlistForm idPrefix="footer" dark />
      </div>

    </div>
  );
}
