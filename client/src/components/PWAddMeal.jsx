// client/src/components/PWAddMeal.jsx
import React, { useRef, useState } from 'react';
import { T, PWIcon2, compressImage } from '../tokens.jsx';
import PWFactLoader from './PWFactLoader.jsx';

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
  const [title, setTitle]         = useState('');
  const [details, setDetails]     = useState('');
  const [photo, setPhoto]         = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType]   = useState('image/jpeg');
  const [mealType, setMealType]   = useState(detectMealType());
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const ready = !!title.trim();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setShowPhotoMenu(false);
    const preview = URL.createObjectURL(f);
    try {
      const { base64, mimeType: mt } = await compressImage(f);
      setPhoto(preview);
      setImageBase64(base64);
      setMimeType(mt);
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

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: T.bg, fontFamily: T.font,
      padding: '24px 20px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{
          width: 34, height: 34, borderRadius: 10, background: T.lineSoft,
          border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          {PWIcon2.chevLeft(16, T.green)}
        </button>
        <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: '-0.3px' }}>
          New Meal
        </div>
      </div>

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Scrambled Eggs"
          style={inputStyle}
        />
      </Field>

      <Field label="Details" optional>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="e.g. three eggs, cooked in a little butter, salt and chili oil"
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </Field>

      {/* Photo area */}
      <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" onChange={onFile}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }} />
      <input ref={libraryInputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {showPhotoMenu && (
        <div onClick={() => setShowPhotoMenu(false)} style={{
          position: 'fixed', inset: 0, zIndex: 10,
        }} />
      )}

      {showPhotoMenu ? (
        <div style={{
          height: 116, borderRadius: 14, border: `2px dashed ${T.line}`,
          background: T.lineSoft, display: 'flex', flexDirection: 'column',
          alignItems: 'stretch', justifyContent: 'center', gap: 8,
          padding: '12px 16px', boxSizing: 'border-box', position: 'relative', zIndex: 11,
        }}>
          <button onClick={() => { cameraInputRef.current?.click(); setShowPhotoMenu(false); }} style={{
            flex: 1, border: 'none', borderRadius: 10, background: '#fff',
            cursor: 'pointer', fontFamily: T.font, fontSize: 13.5, fontWeight: 600,
            color: T.ink, boxShadow: T.shadowSoft,
          }}>
            📷 Take Photo
          </button>
          <button onClick={() => { libraryInputRef.current?.click(); setShowPhotoMenu(false); }} style={{
            flex: 1, border: 'none', borderRadius: 10, background: '#fff',
            cursor: 'pointer', fontFamily: T.font, fontSize: 13.5, fontWeight: 600,
            color: T.ink, boxShadow: T.shadowSoft,
          }}>
            🖼️ Choose from Library
          </button>
        </div>
      ) : photo ? (
        <div onClick={() => setShowPhotoMenu(true)} style={{
          position: 'relative', height: 150, borderRadius: 14, overflow: 'hidden',
          cursor: 'pointer', border: `1px solid ${T.line}`,
        }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(39,26,15,0.65)', color: '#fff',
            fontSize: 10.5, padding: '4px 10px', borderRadius: 999,
          }}>Change photo</div>
        </div>
      ) : (
        <button onClick={() => setShowPhotoMenu(true)} style={{
          height: 116, borderRadius: 14, border: `2px dashed ${T.line}`,
          background: T.lineSoft, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontFamily: T.font,
        }}>
          {PWIcon2.camera(26, T.inkFaint)}
          <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 500 }}>
            Add photo (optional, helps with portions)
          </span>
        </button>
      )}

      <Field label="Meal type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MEAL_TYPES.map((m) => (
            <button key={m} onClick={() => setMealType(m)} style={{
              padding: '8px 16px',
              borderRadius: 22,
              border: 'none',
              cursor: 'pointer',
              fontFamily: T.font,
              fontSize: 13,
              fontWeight: 600,
              background: mealType === m ? T.green : T.lineSoft,
              color: mealType === m ? '#fff' : T.inkMute,
              transition: 'all 0.15s ease',
            }}>{m}</button>
          ))}
        </div>
      </Field>

      {error && (
        <div style={{ background: T.red50, color: T.red, borderRadius: 12, padding: '10px 14px', fontSize: 12.5 }}>
          ⚠ {error}
        </div>
      )}

      <button onClick={onAnalyze} disabled={!ready || loading} style={{
        background: ready ? T.green : T.lineSoft,
        color: ready ? '#fff' : T.inkFaint,
        border: 'none', borderRadius: 14,
        padding: '14px', fontSize: 15, fontWeight: 700,
        cursor: ready ? 'pointer' : 'not-allowed',
        fontFamily: T.font, marginTop: 4,
        boxShadow: ready ? '0 6px 20px rgba(196,103,74,0.3)' : 'none',
        transition: 'all 0.15s ease',
        position: 'relative', overflow: 'hidden',
      }}>
        {loading ? 'Analysing…' : 'Analyse →'}
      </button>

      {loading && <PWFactLoader label="Analysing your meal…" />}
    </div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 10.5, fontWeight: 700, color: T.inkMute,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {label}{' '}
        {optional && <span style={{ fontWeight: 400, textTransform: 'none', color: T.inkFaint }}>(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#fff', border: `1.5px solid ${T.line}`,
  borderRadius: 12, padding: '11px 14px',
  fontSize: 14.5, fontFamily: 'inherit', color: T.ink, outline: 'none',
};
