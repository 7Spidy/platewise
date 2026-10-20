import { useRef, useEffect, useCallback } from 'react';

// Long press (default 500ms). Cancelled by pointer movement over 10px, release, cancel or scroll.
// Returns a function that produces the props to spread on the pressable element.
export default function useLongPress(onLongPress, { delay = 500, moveTolerance = 10 } = {}) {
  const timer = useRef(null);
  const start = useRef({ x: 0, y: 0 });
  const cb = useRef(onLongPress);
  cb.current = onLongPress;

  const cancel = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', cancel, true);
    return () => { window.removeEventListener('scroll', cancel, true); cancel(); };
  }, [cancel]);

  return useCallback((arg) => ({
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancel();
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => { timer.current = null; cb.current(arg); }, delay);
    },
    onPointerMove: (e) => {
      if (!timer.current) return;
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > moveTolerance) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e) => e.preventDefault(),
    style: { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' },
  }), [cancel, delay, moveTolerance]);
}
