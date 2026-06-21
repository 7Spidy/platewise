// client/src/components/PWAddMeal.jsx
import React, { useRef, useState } from 'react';
import { T, PWIcon2, compressImage } from '../tokens.jsx';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

function detectMealType() {
  const h = new Date().getHours();
  if (h < 10) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 18) return 'Snack';
  return 'Dinner';
}

export default function PWAddMeal({ onClose, onAnalyzed }) {
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);
  const [tab, setTab] = useState('photo'); // 'photo' | 'text'
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [mealType, setMealType] = useState(detectMealType());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ready = tab === 'photo' ? !!imageBase64 : !!(title.trim() || details.trim());

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    try {
      const { base64, mimeType: mt } = await compressImage(f);
      setPhoto(preview);
      setImageBase64(base64);
      setMimeType(mt);
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
      const body = tab === 'photo'
        ? { name: title.trim(), details: details.trim(), imageBase64, mimeType }
        : { name: title.trim(), details: details.trim() };

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
      padding: '24px 20px 60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{PWIcon2.close(18, T.green)}</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Add Meal</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.lineSoft, borderRadius: 12, padding: 4 }}>
        {[['photo', '📷 Photo'], ['text', '✏️ Text']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            background: tab === key ? '#fff' : 'transparent',
            color: tab === key ? T.greenInk : T.inkMute,
            boxShadow: tab === key ? T.shadowSoft : 'none',
          }}>{lbl}</button>
        ))}
      </div>

      <Field label="Title" optional>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scrambled Eggs"
          style={inputStyle} />
      </Field>

      <Field label="Details" optional>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
          placeholder="e.g. three eggs, cooked in a little butter, salt and chili oil"
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

      {/* Hidden file inputs — one for gallery, one for camera (capture="environment") */}
      <input ref={fileRef}   type="file" accept="image/*"                    onChange={onFile} style={{ display: 'none' }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />

      {photo ? (
        <div style={{ position: 'relative', height: 140, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.line}` }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
            <button onClick={() => cameraRef.current?.click()} style={changePhotoBtn}>📷 Retake</button>
            <button onClick={() => fileRef.current?.click()}   style={changePhotoBtn}>🖼 Change</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => cameraRef.current?.click()} style={{
            flex: 1, height: 90, borderRadius: 14, border: `2px dashed ${T.line}`, background: T.lineSoft,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {PWIcon2.camera(22, T.inkFaint)}
            <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>Take photo</span>
          </button>
          <button onClick={() => fileRef.current?.click()} style={{
            flex: 1, height: 90, borderRadius: 14, border: `2px dashed ${T.line}`, background: T.lineSoft,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: 22 }}>🖼</span>
            <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>
              {tab === 'photo' ? 'Upload' : 'Upload (optional)'}
            </span>
          </button>
        </div>
      )}

      <Field label="Meal type">
        <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={inputStyle}>
          {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

      {error && <div style={{ background: T.red50, color: T.red, borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>⚠ {error}</div>}

      <button onClick={onAnalyze} disabled={!ready || loading} style={{
        background: ready ? T.green : '#D1D5DB', color: '#fff', border: 'none', borderRadius: 10,
        padding: '13px', fontSize: 14.5, fontWeight: 700, cursor: ready ? 'pointer' : 'not-allowed',
        fontFamily: 'inherit', marginTop: 4,
      }}>{loading ? 'Analysing…' : 'Analyse →'}</button>
    </div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label} {optional && <span style={{ fontWeight: 400, textTransform: 'none', color: T.inkFaint }}>(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#fff', border: `1px solid ${T.line}`,
  borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: T.ink, outline: 'none',
};

const changePhotoBtn = {
  background: 'rgba(17,24,39,0.65)', color: '#fff', border: 'none',
  borderRadius: 999, fontSize: 10.5, padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit',
};
