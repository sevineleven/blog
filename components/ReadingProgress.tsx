'use client';

import { useEffect, useRef } from 'react';

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      const pct = total > 0 ? (el.scrollTop / total) * 100 : 0;
        if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div ref={barRef} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: 2,
      width: '0%',
      background: 'var(--green)',
      boxShadow: '0 0 6px var(--green)',
      zIndex: 100,
      pointerEvents: 'none',
    }} />
  );
}
