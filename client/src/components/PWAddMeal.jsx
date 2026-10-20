// client/src/components/PWAddMeal.jsx — Capture
import React, { useRef, useState } from 'react';
import { T, PWIcon2, compressImage } from '../tokens.jsx';
import PWFactLoader from './PWFactLoader.jsx';
import PWPlate from '../ui/PWPlate.jsx';
import PWPills from '../ui/PWPills.jsx';
import PWButton from '../ui/PWButton.jsx';
import PWActionBar from '../ui/PWActionBar.jsx';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

function detectMealType() {
  const h = new Date().getHours();
  if (h < 10) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 18) return 'Snack';
  return 'Dinner';
}

export default function PWAddMeal({ onClose, onAnalyzed }) {
  const cameraInputRef  = useRef(null);
  const libraryInputRef = useRef(null);
  const [mode, setMode]           = useState('photo');
  const [title, setTitle]         = useState('');
  const [details, setDetails]     = useState('');
  const [photo, setPhoto]         = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType]   = useState('image/jpeg');
  const [mealType, setMealType]   = useState(detectMealType());
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [limitAt, setLimitAt]     = useState(null); // ISO string once the scan limit is hit

  const ready = !!title.trim();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const preview = URL.createObjectURL(f);
    try {
      const { base64, mimeType: mt } = await compressImage(f);
      if (photo) URL.revokeObjectURL(photo);
      setPhoto(preview);
      setImageBase64(base64);
      setMimeType(mt);
      setMode('photo');
      setError(null);
    } catch (err) {
      URL.revokeObjectURL(preview);
      setError(err.message);
    }
  };

  const onAnalyze = async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    setLimitAt(null);
    try {
      const body = {
        name: title.trim(),
        ...(details.trim() && { details: details.trim() }),
        ...(imageBase64 && { imageBase64, mimeType }),
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        if (res.status === 429 && b.error === 'scan_limit_reached') {
          setLimitAt(b.nextAvailableAt || 'unknown');
          return;
        }
        throw new Error(b.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      onAnalyzed(data, { photo, imageBase64, mimeType, mealType });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const limitTime = limitAt && limitAt !== 'unknown'
    ? new Date(limitAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null;

  const panelBase = { background: T.tint, borderRadius: 32, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.fontBody, color: T.ink,
      paddingTop: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center' }}>
          <button onClick={onClose} aria-label="Close" style={{
            width: 44, height: 44, borderRadius: '50%', background: T.tint, border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            {PWIcon2.close(16, T.ink)}
          </button>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 'normal', margin: 0, textAlign: 'center' }}>New meal</h1>
          <span />
        </div>

        <PWPills fill label="How to add" value={mode} onChange={setMode}
          options={[{ value: 'photo', label: 'Photo' }, { value: 'describe', label: 'Describe' }]} />

        {/* Hidden file inputs */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFile}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }} tabIndex={-1} />
        <input ref={libraryInputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

        {mode === 'photo' ? (
          <>
            <div style={{
              ...panelBase, minHeight: 350, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20,
            }}>
              {photo ? (
                <>
                  <PWPlate src={photo} name={title} size={250} alt="Your meal" />
                  <PWButton variant="soft" onClick={() => cameraInputRef.current?.click()} style={{ background: '#fff', height: 48, fontSize: 16 }}>
                    Retake
                  </PWButton>
                </>
              ) : (
                <div style={{ position: 'relative', width: 280, height: 280, display: 'grid', placeItems: 'center', maxWidth: '100%' }}>
                  <svg width="100%" height="100%" viewBox="0 0 280 280" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
                    <circle cx="140" cy="140" r="136" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" />
                  </svg>
                  <button onClick={() => cameraInputRef.current?.click()} aria-label="Take photo" style={{
                    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12, fontFamily: T.fontBody, color: T.ink, fontSize: 16, fontWeight: 600,
                  }}>
                    <span style={{
                      width: 120, height: 120, borderRadius: '50%', background: T.ink, display: 'grid', placeItems: 'center',
                      boxShadow: T.shadowSoft,
                    }}>
                      {PWIcon2.camera(44, '#fff')}
                    </span>
                    Take photo
                  </button>
                </div>
              )}
            </div>
            <PWButton variant="secondary" onClick={() => libraryInputRef.current?.click()} style={{ width: '100%' }}>
              Choose from photos
            </PWButton>
          </>
        ) : (
          <>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-label="Describe your meal"
              placeholder="Two rotis, a bowl of dal, some rice and a small salad"
              style={{
                ...panelBase, minHeight: 240, border: 'none', padding: 22, resize: 'none', outline: 'none',
                fontFamily: T.fontDisplay, fontSize: 22, lineHeight: 1.4, color: T.ink,
              }}
            />
            <PWButton variant="soft" onClick={() => setMode('photo')} style={{ width: '100%' }}>
              {photo ? 'Change photo' : 'Add a photo too'}
            </PWButton>
          </>
        )}

        {/* Name */}
        <div>
          <label htmlFor="pw-meal-name" style={{ display: 'block', fontSize: 14, color: T.inkSoft, marginBottom: 6 }}>
            Meal name
          </label>
          <input
            id="pw-meal-name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. Scrambled eggs"
            style={{
              width: '100%', height: 52, border: 'none', borderRadius: T.rInput, background: T.tint,
              padding: '0 16px', fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {mode === 'photo' && (
          <div>
            <label htmlFor="pw-meal-details" style={{ display: 'block', fontSize: 14, color: T.inkSoft, marginBottom: 6 }}>
              Details <span style={{ color: T.inkMute }}>(optional)</span>
            </label>
            <textarea
              id="pw-meal-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="e.g. three eggs, cooked in a little butter"
              style={{
                width: '100%', border: 'none', borderRadius: T.rInput, background: T.tint, padding: '14px 16px',
                fontSize: 16, fontFamily: T.fontBody, color: T.ink, outline: 'none', resize: 'vertical',
                lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <div>
          <div style={{ fontSize: 14, color: T.inkSoft, marginBottom: 8 }}>Meal type</div>
          <PWPills fill label="Meal type" value={mealType} onChange={setMealType}
            options={MEAL_TYPES.map((m) => ({ value: m, label: m }))} />
        </div>

        {limitAt && (
          <div style={{ background: T.goldTint, color: T.factInk, borderRadius: T.rCard, padding: '14px 18px', fontSize: 15, lineHeight: 1.45 }}>
            You've used your scans for now.{limitTime ? ` More free up at ${limitTime}.` : ' More free up soon.'}
          </div>
        )}

        {error && (
          <div style={{ background: T.dangerTint, color: T.danger, borderRadius: 14, padding: '12px 16px', fontSize: 15 }}>
            {error}
          </div>
        )}
      </div>

      <PWActionBar>
        <PWButton variant="primary" onClick={onAnalyze} disabled={!ready || loading} style={{ width: '100%' }}>
          Analyse meal
        </PWButton>
      </PWActionBar>

      {loading && <PWFactLoader label="Reading your plate" photoSrc={photo} name={title} />}
    </div>
  );
}
