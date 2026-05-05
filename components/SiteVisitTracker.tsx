'use client';

import { useEffect } from 'react';

export default function SiteVisitTracker() {
  useEffect(() => {
    if (sessionStorage.getItem('site_visited')) return;
    sessionStorage.setItem('site_visited', '1');
    fetch('/api/site-visits', { method: 'POST' });
  }, []);

  return null;
}
