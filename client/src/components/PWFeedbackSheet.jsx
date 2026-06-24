import React, { useState } from 'react';
import { T } from '../tokens.jsx';

export default function PWFeedbackSheet({ mealLogId, mealName, onClose }) {
  const [type, setType]       = useState(mealLogId ? 'scan' : 'general');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('loading');
    try {
      const r = await fetch('/api/feedback', {
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(39,26,15,0.35)',
          zIndex: 50,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 32px',
        zIndex: 51, boxShadow: '0 -4px 32px rgba(39,26,15,0.12)',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, background: T.line, borderRadius: 2,
          margin: '0 auto 18px',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: T.heading, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
            Send feedback
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: T.inkMute, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Type toggle — only show if a meal is provided */}
        {mealLogId && (
          <div style={{
            display: 'flex', background: T.bg, borderRadius: 10, padding: 3,
            marginBottom: 16, gap: 3,
          }}>
            {[
              { value: 'scan',    label: `This scan${mealName ? ` (${mealName})` : ''}` },
              { value: 'general', label: 'The app' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  flex: 1, padding: '7px 8px', border: 'none', borderRadius: 8,
                  background: type === opt.value ? '#fff' : 'transparent',
                  color: type === opt.value ? T.ink : T.inkMute,
                  fontWeight: type === opt.value ? 600 : 400,
                  fontSize: 12.5, cursor: 'pointer', fontFamily: T.font,
                  boxShadow: type === opt.value ? T.shadowSoft : 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {status === 'success' ? (
          <div style={{
            textAlign: 'center', padding: '24px 0', fontSize: 15,
            color: T.sage, fontWeight: 600,
          }}>
            Thanks for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'scan'
                ? 'Tell us about this scan — was the nutrition estimate accurate?'
                : 'What could be better about the app?'}
              rows={4}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 10,
                border: `1.5px solid ${T.line}`,
                background: T.bg, fontSize: 14, fontFamily: T.font,
                color: T.ink, resize: 'none', outline: 'none',
                lineHeight: 1.6,
              }}
            />
            {status === 'error' && (
              <div style={{ color: T.red, fontSize: 13 }}>Something went wrong. Please try again.</div>
            )}
            <button
              type="submit"
              disabled={status === 'loading' || !message.trim()}
              style={{
                background: T.green, color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 0', fontSize: 14,
                fontWeight: 600, cursor: status === 'loading' ? 'default' : 'pointer',
                fontFamily: T.font, opacity: (status === 'loading' || !message.trim()) ? 0.65 : 1,
              }}
            >
              {status === 'loading' ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
