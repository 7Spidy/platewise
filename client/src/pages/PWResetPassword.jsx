import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import PWAuthLayout, { AuthField, AuthError, authInput } from '../ui/PWAuthLayout.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [valid, setValid] = useState(null); // null=checking, true, false
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/public/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => {
        setValid(r.ok);
      })
      .catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/public/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Something went wrong');
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

  if (valid === null) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: T.inkMute, fontSize: 16, fontFamily: T.fontBody }}>Validating link…</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <PWAuthLayout title="Link expired" subtitle="This reset link is invalid or has expired. Request a new one." plate="chai">
        <PWButton variant="primary" onClick={() => navigate('/forgot-password')} style={{ width: '100%' }}>Request new link</PWButton>
      </PWAuthLayout>
    );
  }

  return (
    <PWAuthLayout title="Set new password" subtitle="Must be at least 8 characters." plate="poha">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthField label="New password" id="reset-password">
          <input id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="new-password" placeholder="At least 8 characters" style={authInput} />
        </AuthField>
        <AuthField label="Confirm password" id="reset-confirm">
          <input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required autoComplete="new-password" placeholder="Repeat password" style={authInput} />
        </AuthField>
        <AuthError>{error}</AuthError>
        <PWButton type="submit" variant="primary" busy={loading} style={{ width: '100%' }}>Set password</PWButton>
      </form>
    </PWAuthLayout>
  );
}
