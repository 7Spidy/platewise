import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import PWAuthLayout, { AuthField, AuthError, authInput, authLink } from '../ui/PWAuthLayout.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'passcode'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = mode === 'passcode'
        ? { passcode }
        : { email, password };
      const r = await fetch('/api/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      if (data.onboardingDone === false) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PWAuthLayout title="Welcome back" subtitle="Sign in to your account" plate="thali">
      <div style={{ marginBottom: 20 }}>
        <PWPills fill label="Sign in method" value={mode}
          onChange={(m) => { setMode(m); setError(''); }}
          options={[{ value: 'email', label: 'Email' }, { value: 'passcode', label: 'Passcode' }]} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mode === 'email' ? (
          <>
            <AuthField label="Email" id="login-email">
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com" style={authInput} />
            </AuthField>
            <AuthField label="Password" id="login-password">
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="Your password" style={authInput} />
            </AuthField>
          </>
        ) : (
          <AuthField label="Admin passcode" id="login-passcode">
            <input id="login-passcode" type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)}
              required autoComplete="off" placeholder="Enter passcode" style={authInput} />
          </AuthField>
        )}

        <AuthError>{error}</AuthError>

        <PWButton type="submit" variant="primary" busy={loading} style={{ width: '100%' }}>Sign in</PWButton>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 14 }}>
        {mode === 'email' && (
          <button type="button" onClick={() => navigate('/forgot-password')} style={authLink}>Forgot password?</button>
        )}
        <div style={{ fontSize: 15, color: T.inkSoft, display: 'flex', alignItems: 'center', gap: 6 }}>
          Don't have an account?
          <button type="button" onClick={() => navigate('/')} style={authLink}>Join waitlist</button>
        </div>
      </div>
    </PWAuthLayout>
  );
}
