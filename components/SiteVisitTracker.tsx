'use client';

import { useEffect } from 'react';

export default function SiteVisitTracker() {
  useEffect(() => {
    // 운영 도메인에서만 집계한다. 로컬(localhost)·Vercel 프리뷰는 같은 Supabase 를 쓰므로
    // 카운트하면 개발 트래픽이 운영 방문수를 오염시킨다.
    if (window.location.hostname !== 'blog.sevin.dev') return;
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
