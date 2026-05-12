import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition analysis AI. The user will provide a food name and an image.

Analyze the food and return ONLY a JSON object with this exact schema. No markdown, no prose, no backticks — raw JSON only.

{
  "name": "string — formatted food name",
  "serving": "string — assumed serving size e.g. '1 cup (240g)'",
  "calories": number,
  "macros": {
    "carbs": number,
    "protein": number,
    "fat": number
  },
  "other": {
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "fact": "string — one surprising, specific fact about this food. Not generic health advice.",
  "tips": ["string", "string", "string"],
  "healthScore": number between 1-10,
  "mismatch": boolean
}

Rules:
- "tips" must contain exactly 3 actionable tips to make this food healthier. Ban generic tips like "eat in moderation".
- "mismatch" is true if the image clearly doesn't match the food name.
- Base macros and calories on a realistic standard serving. All macro values in grams. Sodium in mg.
- Return raw JSON only — no markdown fences, no explanatory text.`;

function stripFences(text) {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, imageBase64, mimeType } = req.body || {};
  if (!name || !imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'Missing required fields: name, imageBase64, mimeType' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: `Food name: ${name}` },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = stripFences(textBlock?.text ?? '');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('Model returned invalid JSON:', raw);
      return res.status(502).json({ error: 'Model returned invalid JSON' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    return res.status(status).json({ error: err?.message ?? 'Internal server error' });
  }
}
