// client/src/lib/theme.js — Cookbook theme. Pure JS so vitest can import it.
export const THEME = {
  // surfaces
  bg:         '#FFFFFF',
  surface:    '#FFFFFF',
  tint:       '#EFF4EB',   // sage panels, input fills, secondary buttons
  tintStrong: '#E3ECDD',   // pressed / selected panel
  goldTint:   '#F6EEDC',   // food fact panel only
  dangerTint: '#FBEDEA',

  // text (all pass WCAG AA 4.5:1 on bg AND on tint; see tests)
  ink:        '#17362A',   // primary text, primary buttons, nav FAB
  inkSoft:    '#4F6458',   // secondary text
  inkMute:    '#5E6F64',   // captions, meta, placeholders
  sageInk:    '#3F6B37',   // sage-coloured TEXT (success, "on track")
  goldInk:    '#7C5B12',   // gold-coloured TEXT (over target, fact panel labels)
  factInk:    '#5E4A1E',   // food fact body text on goldTint
  danger:     '#A6402B',   // destructive text and icons
  onAccent:   '#FFFFFF',   // text on ink-filled buttons

  // non-text only (fills, strokes, dots, charts). Never use for text.
  inkFaint:   '#8B998F',   // disabled icons, dotted leaders (at reduced opacity)
  line:       '#E2E9DF',   // hairlines, plate rim stroke
  lineStrong: '#CAD6C5',   // empty-plate dashed border, unfilled dots
  sage:       '#4E7F45',   // fills: progress under target, health dots, protein
  gold:       '#B4862C',   // fills: over target, analyzing arc, carbs
  fat:        '#6F8F9B',   // fills: fat series in charts

  // effects
  plateShadow: '0 18px 24px -12px rgba(23,54,42,0.18)',
  shadowSoft:  '0 4px 14px -6px rgba(23,54,42,0.25)',
  sheetShadow: '0 -12px 40px -12px rgba(23,54,42,0.25)',

  // radii
  rPanel: 30, rCard: 24, rInput: 18, rPill: 999,

  // type
  fontDisplay: "'Young Serif', Georgia, 'Times New Roman', serif",
  fontBody:    "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// Type scale (px). Young Serif ships ONE weight (400): never set fontWeight on fontDisplay.
export const TYPE = {
  hero: 66,      // fontDisplay: kcal left on Today
  display: 44,   // fontDisplay: Welcome headline
  h1: 34,        // fontDisplay: screen titles
  h2: 30,        // fontDisplay: meal name on Review / Meal
  h3: 22,        // fontDisplay: section headings
  plateName: 17, // fontDisplay: names under plates
  bodyLg: 17,
  body: 16,
  caption: 14,
  min: 13,       // floor. Nothing smaller.
};

export const MACRO_COLORS = { protein: THEME.sage, carbs: THEME.gold, fat: THEME.fat };
