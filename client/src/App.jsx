import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PWDashboard   from './components/PWDashboard.jsx';
import PWAddMeal     from './components/PWAddMeal.jsx';
import PWReview      from './components/PWReview.jsx';
import PWLibrary     from './components/PWLibrary.jsx';
import PWHistory     from './components/PWHistory.jsx';
import PWEditMeal    from './components/PWEditMeal.jsx';
import PWOnboarding  from './components/PWOnboarding.jsx';
import PWAdmin       from './components/PWAdmin.jsx';
import PWLanding     from './pages/PWLanding.jsx';
import PWLogin       from './pages/PWLogin.jsx';
import PWForgotPassword  from './pages/PWForgotPassword.jsx';
import PWResetPassword   from './pages/PWResetPassword.jsx';
import PWAcceptInvite    from './pages/PWAcceptInvite.jsx';
import { PW_TOKENS, T } from './tokens.jsx';

export { PW_TOKENS };

const HOW_IT_WORKS_STEPS = [
  { n: '01', t: 'Add a meal',           d: 'Snap a photo or just describe what you ate — both work, with or without a photo attached.' },
  { n: '02', t: 'Claude does the math', d: 'Claude vision breaks the meal into ingredients and estimates calories, macros, and micros.' },
  { n: '03', t: 'Review & tweak',       d: 'Adjust any ingredient quantity and Claude recalculates the nutrition instantly.' },
  { n: '04', t: 'Save & track',         d: 'It lands on your Dashboard under the right meal type, with rings tracking your daily targets.' },
];

function PWHowItWorks({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.35)',
      zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, maxWidth: 380, width: '100%',
        fontFamily: T.font, overflow: 'hidden', boxShadow: T.shadow,
      }}>
        <div style={{ padding: '22px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
            How Platewise works
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T.inkMute }}>×</button>
        </div>
        <div style={{ padding: '0 24px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HOW_IT_WORKS_STEPS.map((s) => (
            <div key={s.n} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: 12,
              background: T.bg, border: `1px solid ${T.line}`,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: T.green,
                background: '#fff', border: `1px solid ${T.line}`,
                padding: '3px 7px', borderRadius: 7, flexShrink: 0,
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px 22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: T.green, color: '#fff', border: 'none',
            borderRadius: 999, padding: '9px 20px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: T.font,
          }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// ── RequireAuth wrapper ──────────────────────────────────────────────────────
function RequireAuth({ children, requireAdmin = false }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | ok | unauthed | notAdmin | needsOnboarding

  useEffect(() => {
    fetch('/api/auth-me')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((user) => {
        if (requireAdmin && user.role !== 'admin') {
          setStatus('notAdmin');
        } else if (!user.onboarding_completed_at && user.role !== 'admin') {
          setStatus('needsOnboarding');
        } else {
          setStatus('ok');
        }
      })
      .catch(() => setStatus('unauthed'));
  }, [requireAdmin]);

  if (status === 'checking') return <div style={{ minHeight: '100vh', background: T.bg }} />;
  if (status === 'unauthed') return <Navigate to="/login" replace />;
  if (status === 'notAdmin') return <Navigate to="/app" replace />;
  if (status === 'needsOnboarding') return <Navigate to="/onboarding" replace />;
  return children;
}

// ── Authenticated app shell (state-switched internally, no route change) ────
function AppShell() {
  const [view, setView]               = useState('dashboard');
  const [reviewData, setReviewData]   = useState(null);
  const [reviewDraft, setReviewDraft] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isDesktop, setIsDesktop]     = useState(window.innerWidth >= 900);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const goDashboard = () => {
    setView('dashboard');
    setReviewData(null);
    setReviewDraft(null);
    setEditingMeal(null);
    setRefreshSignal((s) => s + 1);
  };

  const goHistory  = () => setView('history');
  const goLibrary  = () => setView('library');
  const goAddMeal  = () => setView('addMeal');

  const onAnalyzed = (data, draft) => {
    setReviewData(data);
    setReviewDraft(draft);
    setView('review');
  };

  const onEditMeal = (meal) => {
    setEditingMeal(meal);
    setView('editMeal');
  };

  const isSplitStep = view === 'addMeal' || view === 'review';

  let mainContent = null;
  if (view === 'dashboard') {
    mainContent = (
      <PWDashboard
        onAddMeal={goAddMeal} onHistory={goHistory}
        onLibrary={goLibrary} onEditMeal={onEditMeal}
        refreshSignal={refreshSignal}
      />
    );
  } else if (view === 'library') {
    mainContent = (
      <PWLibrary onBack={goDashboard} onHome={goDashboard} onAddMeal={goAddMeal} onHistory={goHistory} />
    );
  } else if (view === 'history') {
    mainContent = (
      <PWHistory onBack={goDashboard} onHome={goDashboard} onAddMeal={goAddMeal} onLibrary={goLibrary} onEditMeal={onEditMeal} />
    );
  } else if (view === 'editMeal') {
    mainContent = <PWEditMeal meal={editingMeal} onBack={goDashboard} onSaved={goDashboard} />;
  } else if (view === 'addMeal') {
    mainContent = <PWAddMeal onClose={goDashboard} onAnalyzed={onAnalyzed} />;
  } else if (view === 'review') {
    mainContent = (
      <PWReview data={reviewData} draft={reviewDraft} onBack={() => setView('addMeal')} onSaved={goDashboard} />
    );
  }

  if (isSplitStep && isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center', padding: '40px 24px', fontFamily: T.font }}>
        <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 920, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadow }}>
            <PWAddMeal onClose={goDashboard} onAnalyzed={onAnalyzed} />
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadow, minHeight: 200 }}>
            {reviewData
              ? <PWReview data={reviewData} draft={reviewDraft} onBack={() => setReviewData(null)} onSaved={goDashboard} />
              : (
                <div style={{ padding: 40, textAlign: 'center', color: T.inkMute, fontSize: 13 }}>
                  Your AI review will appear here once you analyse a meal.
                </div>
              )}
          </div>
        </div>
        <button onClick={() => setShowHowItWorks(true)} style={{
          position: 'fixed', bottom: 20, left: 20,
          background: '#fff', border: `1px solid ${T.line}`, borderRadius: 999,
          padding: '7px 14px', fontSize: 11.5, color: T.inkMute,
          cursor: 'pointer', fontFamily: T.font, boxShadow: T.shadowSoft,
        }}>How it works</button>
        {showHowItWorks && <PWHowItWorks onClose={() => setShowHowItWorks(false)} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: isDesktop ? 480 : '100%',
        minHeight: '100vh', background: T.bg,
        boxShadow: isDesktop ? T.shadow : 'none',
        position: 'relative',
      }}>
        {mainContent}
      </div>
      {view === 'dashboard' && (
        <button onClick={() => setShowHowItWorks(true)} style={{
          position: 'fixed', bottom: 88, left: 24,
          background: '#fff', border: `1px solid ${T.line}`, borderRadius: 999,
          padding: '6px 12px', fontSize: 10.5, color: T.inkMute,
          cursor: 'pointer', fontFamily: T.font, boxShadow: T.shadowSoft, zIndex: 15,
        }}>?</button>
      )}
      {showHowItWorks && <PWHowItWorks onClose={() => setShowHowItWorks(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"                      element={<PWLanding />} />
      <Route path="/login"                 element={<PWLogin />} />
      <Route path="/forgot-password"       element={<PWForgotPassword />} />
      <Route path="/reset-password/:token" element={<PWResetPassword />} />
      <Route path="/invite/:token"         element={<PWAcceptInvite />} />

      {/* Onboarding — auth'd but before onboarding_completed_at */}
      <Route path="/onboarding" element={
        <RequireAuth>
          <PWOnboarding onComplete={() => window.location.replace('/app')} />
        </RequireAuth>
      } />

      {/* Authenticated app */}
      <Route path="/app/*" element={
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      } />

      {/* Admin dashboard */}
      <Route path="/admin" element={
        <RequireAuth requireAdmin={true}>
          <PWAdmin />
        </RequireAuth>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
