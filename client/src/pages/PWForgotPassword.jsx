import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../tokens.jsx';
import PWAuthLayout, { AuthField, AuthError, authInput, authLink } from '../ui/PWAuthLayout.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/public/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        setSent(true);
      } else {
        const data = await r.json();
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PWAuthLayout title="Forgot password" subtitle="Enter your email and we'll send a reset link valid for 30 minutes." plate="chai">
      {sent ? (
        <div style={{ background: T.tint, borderRadius: T.rCard, padding: '16px 18px', color: T.sageInk, fontSize: 16, lineHeight: 1.5 }}>
          If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly. Check your spam folder too.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AuthField label="Email" id="forgot-email">
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" placeholder="you@example.com" style={authInput} />
          </AuthField>
          <AuthError>{error}</AuthError>
          <PWButton type="submit" variant="primary" busy={loading} style={{ width: '100%' }}>Send reset link</PWButton>
        </form>
      )}
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button type="button" onClick={() => navigate('/login')} style={authLink}>Back to sign in</button>
      </div>
    </PWAuthLayout>
  );
}
