import { describe, it, expect, vi } from 'vitest';
import { plateContent } from '../client/src/lib/plate.js';

const emoji = (n) => `E:${n}`;

describe('plateContent', () => {
  it('uses the photo for a non-empty string', () => {
    expect(plateContent('https://x/y.jpg', 'Dal', emoji)).toEqual({ kind: 'photo', value: 'https://x/y.jpg' });
  });

  it('falls back to emoji for null, undefined, empty and whitespace', () => {
    for (const src of [null, undefined, '', '   ']) {
      expect(plateContent(src, 'Dal', emoji)).toEqual({ kind: 'emoji', value: 'E:Dal' });
    }
  });

  it('passes the name to the emoji function (empty string when missing)', () => {
    const fn = vi.fn(() => '🍽️');
    plateContent(null, 'Poha', fn);
    expect(fn).toHaveBeenCalledWith('Poha');
    plateContent(null, undefined, fn);
    expect(fn).toHaveBeenLastCalledWith('');
  });
});
