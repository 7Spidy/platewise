import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PWDashboard   from './components/PWDashboard.jsx';
import PWAddMeal     from './components/PWAddMeal.jsx';
import PWReview      from './components/PWReview.jsx';
import PWLibrary     from './components/PWLibrary.jsx';
import PWYou         from './components/PWYou.jsx';
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

// ── RequireAuth wrapper ──────────────────────────────────────────────────────
function RequireAuth({ children, requireAdmin = false, allowIncompleteOnboarding = false }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | ok | unauthed | notAdmin | needsOnboarding

  useEffect(() => {
    fetch('/api/me/session')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((user) => {
        if (requireAdmin && user.role !== 'admin') {
          setStatus('notAdmin');
        } else if (!allowIncompleteOnboarding && !user.onboarding_completed_at && user.role !== 'admin') {
          setStatus('needsOnboarding');
        } else {
          setStatus('ok');
        }
      })
      .catch(() => setStatus('unauthed'));
  }, [requireAdmin, allowIncompleteOnboarding]);

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
  const goYou      = () => setView('you');

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
        onLibrary={goLibrary} onYou={goYou} onEditMeal={onEditMeal}
        refreshSignal={refreshSignal}
      />
    );
  } else if (view === 'library') {
    mainContent = (
      <PWLibrary onBack={goDashboard} onHome={goDashboard} onAddMeal={goAddMeal} onHistory={goHistory} onYou={goYou} />
    );
  } else if (view === 'history') {
    mainContent = (
      <PWHistory onBack={goDashboard} onHome={goDashboard} onAddMeal={goAddMeal} onLibrary={goLibrary} onYou={goYou} onEditMeal={onEditMeal} />
    );
  } else if (view === 'you') {
    mainContent = <PWYou onToday={goDashboard} onHistory={goHistory} onScan={goAddMeal} onLibrary={goLibrary} />;
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
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center', padding: '40px 24px', fontFamily: T.fontBody }}>
        <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 920, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadowSoft }}>
            <PWAddMeal onClose={goDashboard} onAnalyzed={onAnalyzed} />
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', boxShadow: T.shadowSoft, minHeight: 200 }}>
            {reviewData
              ? <PWReview data={reviewData} draft={reviewDraft} onBack={() => setReviewData(null)} onSaved={goDashboard} />
              : (
                <div style={{ padding: 40, textAlign: 'center', color: T.inkMute, fontSize: 13 }}>
                  Your AI review will appear here once you analyse a meal.
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: isDesktop ? 480 : '100%',
        minHeight: '100vh', background: T.bg,
        boxShadow: isDesktop ? T.shadowSoft : 'none',
        position: 'relative',
      }}>
        {mainContent}
      </div>
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
      <Route path="/reset-password" element={<PWResetPassword />} />
      <Route path="/invite"         element={<PWAcceptInvite />} />

      {/* Onboarding — auth'd but before onboarding_completed_at */}
      <Route path="/onboarding" element={
        <RequireAuth allowIncompleteOnboarding>
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
