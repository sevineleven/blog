'use client';

import { useEffect, useState } from 'react';

const KEY = 'blog_liked';

function likedSlugs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveLiked(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {}
}

export default function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(likedSlugs().includes(slug));
    fetch('/api/likes')
      .then((r) => r.json())
      .then((m) => setCount(m?.[slug] ?? 0))
      .catch(() => setCount(0));
  }, [slug]);

  async function toggle() {
    if (busy || count === null) return;
    setBusy(true);
    const next = !liked;
    const before = likedSlugs();

    // 낙관적 업데이트
    setLiked(next);
    setCount((c) => Math.max(0, (c ?? 0) + (next ? 1 : -1)));
    saveLiked(next ? [...new Set([...before, slug])] : before.filter((s) => s !== slug));

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action: next ? 'like' : 'unlike' }),
      });
      const data = await res.json();
      if (typeof data?.count === 'number') setCount(data.count);
    } catch {
      // 롤백
      setLiked(!next);
      setCount((c) => Math.max(0, (c ?? 0) + (next ? -1 : 1)));
      saveLiked(before);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '48px 0 8px' }}>
      <button
        onClick={toggle}
        disabled={busy || count === null}
        aria-pressed={liked}
        aria-label={liked ? '좋아요 취소' : '좋아요'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--mono)',
          fontSize: 13,
          color: liked ? 'var(--red, #ff6b6b)' : 'var(--muted)',
          background: liked ? 'rgba(255,107,107,0.08)' : 'transparent',
          border: '1px solid',
          borderColor: liked ? 'rgba(255,107,107,0.35)' : 'var(--border)',
          borderRadius: 999,
          padding: '8px 18px',
          cursor: busy ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{liked ? '♥' : '♡'}</span>
        <span>{count ?? '·'}</span>
      </button>
    </div>
  );
}
