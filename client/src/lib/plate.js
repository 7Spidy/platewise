// Decides what a plate shows: the user's photo, or an emoji fallback.
export function plateContent(src, name, getEmoji) {
  if (typeof src === 'string' && src.trim()) return { kind: 'photo', value: src };
  return { kind: 'emoji', value: getEmoji(name || '') };
}
