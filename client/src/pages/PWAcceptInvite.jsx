import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import PWAuthLayout, { AuthField, AuthError, authInput } from '../ui/PWAuthLayout.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWAcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [inviteEmail, setInviteEmail] = useState('');
  const [valid, setValid] = useState(null); // null=checking, true, false
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/public/invite?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) { setValid(false); return; }
        const data = await r.json();
        setInviteEmail(data.email ?? '');
        setValid(true);
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
      const r = await fetch('/api/public/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name: name.trim() || undefined }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      // New user always goes through onboarding
      navigate('/onboarding');
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  if (valid === null) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: T.inkMute, fontSize: 16, fontFamily: T.fontBody }}>Validating invite…</div>
      </div>
    );
  }

  if (!valid) {
    return (
      <PWAuthLayout title="Invite expired" subtitle="This invite link is invalid or has expired. Contact the admin for a new one." plate="chai">
        <PWButton variant="primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>Back to sign in</PWButton>
      </PWAuthLayout>
    );
  }

  return (
    <PWAuthLayout
      title="You're in"
      subtitle={<>Create your account for <strong style={{ color: T.ink }}>{inviteEmail}</strong></>}
      plate="thali"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AuthField label="Your name (optional)" id="invite-name">
          <input id="invite-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            autoComplete="name" placeholder="Avi" style={authInput} />
        </AuthField>
        <AuthField label="Password" id="invite-password">
          <input id="invite-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="new-password" placeholder="At least 8 characters" style={authInput} />
        </AuthField>
        <AuthField label="Confirm password" id="invite-confirm">
          <input id="invite-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required autoComplete="new-password" placeholder="Repeat password" style={authInput} />
        </AuthField>
        <AuthError>{error}</AuthError>
        <PWButton type="submit" variant="primary" busy={loading} style={{ width: '100%' }}>Create account</PWButton>
      </form>
    </PWAuthLayout>
  );
}
