import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import PWLock from './components/PWLock.jsx';
import PWDashboard from './components/PWDashboard.jsx';
import PWAddMeal from './components/PWAddMeal.jsx';
import PWReview from './components/PWReview.jsx';
import PWLibrary from './components/PWLibrary.jsx';
import PWHistory from './components/PWHistory.jsx';
import PWEditMeal from './components/PWEditMeal.jsx';
import { PW_TOKENS, T } from './tokens.jsx';

// Re-exported for backward compatibility — PWLock.jsx imports PW_TOKENS from here.
export { PW_TOKENS };

const HOW_IT_WORKS_STEPS = [
  { n: '01', t: 'Add a meal', d: 'Snap a photo or just describe what you ate — both work, with or without a photo attached.' },
  { n: '02', t: 'Claude does the math', d: 'Claude vision breaks the meal into ingredients and estimates calories, macros, and micros.' },
  { n: '03', t: 'Review & tweak', d: 'Adjust any ingredient quantity and Claude recalculates the nutrition instantly.' },
  { n: '04', t: 'Save & track', d: 'It lands on your Dashboard under the right meal type, with rings tracking your daily targets.' },
];

function PWHowItWorks({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 380, width: '100%', fontFamily: T.font, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ padding: '22px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: -0.4 }}>How Platewise works</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.inkMute }}>×</button>
        </div>
        <div style={{ padding: '0 24px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HOW_IT_WORKS_STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: T.bg, border: `1px solid ${T.line}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.green, background: '#fff', border: `1px solid ${T.line}`, padding: '3px 7px', borderRadius: 7 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px 22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | addMeal | review | library | history | editMeal
  const [reviewData, setReviewData] = useState(null);
  const [reviewDraft, setReviewDraft] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div style={{ minHeight: '100vh', background: T.bg }} />;
  }
  if (authed === false) return <PWLock onUnlock={() => setAuthed(true)} />;

  const goDashboard = () => {
    setView('dashboard');
    setReviewData(null);
    setReviewDraft(null);
    setEditingMeal(null);
    setRefreshSignal((s) => s + 1);
  };

  const onAnalyzed = (data, draft) => {
    setReviewData(data);
    setReviewDraft(draft);
    setView('review');
  };

  const onEditMeal = (meal) => {
    setEditingMeal(meal);
    setView('editMeal');
  };

  // Add Meal + Review get a side-by-side desktop treatment; everything else is a centered single column.
  const isSplitStep = view === 'addMeal' || view === 'review';

  let mainContent = null;
  if (view === 'dashboard') {
    mainContent = (
      <PWDashboard
        onAddMeal={() => setView('addMeal')}
        onHistory={() => setView('history')}
        onLibrary={() => setView('library')}
        onEditMeal={onEditMeal}
        refreshSignal={refreshSignal}
      />
    );
  } else if (view === 'library') {
    mainContent = <PWLibrary onBack={goDashboard} />;
  } else if (view === 'history') {
    mainContent = <PWHistory onBack={goDashboard} onEditMeal={onEditMeal} />;
  } else if (view === 'editMeal') {
    mainContent = <PWEditMeal meal={editingMeal} onBack={goDashboard} onSaved={goDashboard} />;
  } else if (view === 'addMeal') {
    mainContent = <PWAddMeal onClose={goDashboard} onAnalyzed={onAnalyzed} />;
  } else if (view === 'review') {
    mainContent = <PWReview data={reviewData} draft={reviewDraft} onBack={() => setView('addMeal')} onSaved={goDashboard} />;
  }

  if (isSplitStep && isDesktop) {
    return (
      <>
        <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center', padding: '40px 24px', fontFamily: T.font }}>
          <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 920, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadow }}>
              <PWAddMeal onClose={goDashboard} onAnalyzed={onAnalyzed} />
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadow, minHeight: 200 }}>
              {reviewData
                ? <PWReview data={reviewData} draft={reviewDraft} onBack={() => setReviewData(null)} onSaved={goDashboard} />
                : <div style={{ padding: 40, textAlign: 'center', color: T.inkMute, fontSize: 13 }}>Your AI review will appear here once you analyse a meal.</div>}
            </div>
          </div>
          <button onClick={() => setShowHowItWorks(true)} style={{ position: 'fixed', bottom: 20, left: 20, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 999, padding: '7px 13px', fontSize: 11.5, color: T.inkMute, cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadowSoft }}>How it works</button>
          {showHowItWorks && <PWHowItWorks onClose={() => setShowHowItWorks(false)} />}
        </div>
        <SpeedInsights />
      </>
    );
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: isDesktop ? 480 : '100%', minHeight: '100vh', background: T.bg, boxShadow: isDesktop ? T.shadow : 'none' }}>
          {mainContent}
        </div>
        {view === 'dashboard' && (
          <button onClick={() => setShowHowItWorks(true)} style={{ position: 'fixed', bottom: 28, left: 24, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 999, padding: '7px 13px', fontSize: 11, color: T.inkMute, cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadowSoft, zIndex: 15 }}>?</button>
        )}
        {showHowItWorks && <PWHowItWorks onClose={() => setShowHowItWorks(false)} />}
      </div>
      <SpeedInsights />
    </>
  );
}
