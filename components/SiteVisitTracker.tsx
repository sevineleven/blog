'use client';

import { useEffect } from 'react';

export default function SiteVisitTracker() {
  useEffect(() => {
    if (sessionStorage.getItem('site_visited')) return;
    sessionStorage.setItem('site_visited', '1');
    fetch('/api/site-visits', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.today != null) {
          window.dispatchEvent(
            new CustomEvent('site-stats-update', { detail: { today: data.today, total: data.total } })
          );
        }
      });
  }, []);

  return null;
}
