'use client';

import { useEffect } from 'react';

export default function UniverseShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return <>{children}</>;
}
