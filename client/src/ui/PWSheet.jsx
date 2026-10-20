import React, { useEffect, useRef } from 'react';
import { T } from '../tokens.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Bottom sheet used by every modal; centred dialog on desktop.
export default function PWSheet({ title, onClose, children, labelledBy = 'pw-sheet-title' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement;
    const node = ref.current;
    const items = node ? node.querySelectorAll(FOCUSABLE) : [];
    (items[0] || node)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current?.(); return; }
      if (e.key !== 'Tab' || !node) return;
      const list = Array.from(node.querySelectorAll(FOCUSABLE));
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, []);

  const isDesktop = typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 900px)').matches;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(23,54,42,0.35)', zIndex: 110,
        display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: isDesktop ? 440 : 480, maxHeight: '90vh', overflowY: 'auto',
          borderRadius: isDesktop ? 28 : '28px 28px 0 0', boxShadow: T.sheetShadow,
          padding: '12px 22px calc(24px + env(safe-area-inset-bottom))', outline: 'none',
          animation: 'pwFadeUp 0.22s ease both', fontFamily: T.fontBody, color: T.ink,
        }}
      >
        {!isDesktop && <div style={{ width: 40, height: 5, borderRadius: 3, background: T.line, margin: '0 auto 14px' }} />}
        {title && (
          <h2 id={labelledBy} style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 'normal', margin: '0 0 14px', color: T.ink }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
