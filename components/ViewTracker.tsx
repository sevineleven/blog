'use client';

import { useEffect } from 'react';

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // 운영 도메인에서만 집계한다. 로컬(localhost)·Vercel 프리뷰는 같은 Supabase 를 쓰므로
    // 카운트하면 개발 트래픽이 운영 조회수를 오염시킨다. (site-visits 와 동일 정책)
    if (window.location.hostname !== 'blog.sevin.dev') return;
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
  }, [slug]);

  return null;
}
