'use client';

import { useEffect } from 'react';

export default function UniverseShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Universe는 항상 다크 고정
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');

    return () => {
      document.body.style.overflow = '';
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  return <>{children}</>;
}
