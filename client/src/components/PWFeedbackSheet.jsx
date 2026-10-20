import React, { useState } from 'react';
import { T } from '../tokens.jsx';
import PWSheet from '../ui/PWSheet.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWButton from '../ui/PWButton.jsx';

export default function PWFeedbackSheet({ mealLogId, mealName, onClose }) {
  const [type, setType]       = useState(mealLogId ? 'scan' : 'general');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('loading');
    try {
      const r = await fetch('/api/me/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          meal_log_id: type === 'scan' ? mealLogId : null,
        }),
      });
      if (!r.ok) throw new Error('Failed');
      setStatus('success');
      setTimeout(() => onClose?.(), 1200);
    } catch {
      setStatus('error');
    }
  }

  return (
    <PWSheet title="Send feedback" onClose={onClose} labelledBy="pw-feedback-title">
      {mealLogId && (
        <div style={{ marginBottom: 16 }}>
          <PWPills fill label="Feedback about" value={type} onChange={setType}
            options={[
              { value: 'scan', label: mealName ? `This scan` : 'This scan' },
              { value: 'general', label: 'The app' },
            ]} />
          {mealName && type === 'scan' && (
            <div style={{ fontSize: 14, color: T.inkMute, marginTop: 8 }}>About: {mealName}</div>
          )}
        </div>
      )}

      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '28px 0', fontSize: 17, color: T.sageInk, fontWeight: 600 }}>
          Thanks for your feedback!
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Your feedback"
            placeholder={type === 'scan'
              ? 'Tell us about this scan. Was the nutrition estimate accurate?'
              : 'What could be better about the app?'}
            rows={5}
            required
            style={{
              width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: T.rInput,
              border: 'none', background: T.tint, fontSize: 16, fontFamily: T.fontBody,
              color: T.ink, resize: 'none', outline: 'none', lineHeight: 1.5,
            }}
          />
          {status === 'error' && (
            <div role="alert" style={{ color: T.danger, background: T.dangerTint, borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
              Something went wrong. Please try again.
            </div>
          )}
          <PWButton type="submit" variant="primary" busy={status === 'loading'} disabled={!message.trim()} style={{ width: '100%' }}>
            Send feedback
          </PWButton>
        </form>
      )}
    </PWSheet>
  );
}
