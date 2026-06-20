// lib/blob.js
import { put } from '@vercel/blob';
import crypto from 'crypto';

// imageBase64 is the same already-compressed (~600px) JPEG the client sends to /api/analyze —
// we just forward it here too, no second compression pass needed.
export async function uploadMealPhoto(base64, mimeType = 'image/jpeg') {
  const buffer = Buffer.from(base64, 'base64');
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `meals/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
  });

  return blob.url;
}
