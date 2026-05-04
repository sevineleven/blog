'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/posts';

interface Props {
  posts: PostMeta[];
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ posts, open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? posts.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.excerpt.toLowerCase().includes(q)
        );
      })
    : posts.slice(0, 8);

  const navigate = useCallback((post: PostMeta) => {
    router.push(`/posts/${post.slug}`);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // universe ESC 네비게이션 방지
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && filtered[activeIdx]) navigate(filtered[activeIdx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, filtered, activeIdx, navigate]);

  if (!open) return null;

  // slug에서 날짜 제거해서 경로처럼 표시
  const toPath = (slug: string) => `~/blog/posts/${slug}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '16vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 620, margin: '0 20px',
          background: '#13131a',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          fontFamily: 'var(--mono)',
        }}
      >
        {/* 터미널 타이틀바 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 14px',
          background: '#1c1c24',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted)' }}>search — zsh</span>
        </div>

        {/* 입력줄 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--green)', fontSize: 13, userSelect: 'none' }}>$&nbsp;</span>
          <span style={{ color: 'var(--text)', fontSize: 13, userSelect: 'none' }}>grep&nbsp;</span>
          <span style={{ color: 'var(--yellow)', fontSize: 13, userSelect: 'none' }}>&quot;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="keyword"
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--yellow)', fontFamily: 'var(--mono)', fontSize: 13,
              width: query ? `${Math.max(query.length, 7)}ch` : '7ch',
              minWidth: '1ch', maxWidth: 240,
            }}
          />
          <span style={{ color: 'var(--yellow)', fontSize: 13, userSelect: 'none' }}>&quot;&nbsp;</span>
          <span style={{ color: 'var(--blue)', fontSize: 13, userSelect: 'none' }}>~/blog/posts/</span>
          {/* 깜빡이는 커서 */}
          <span className="cursor" />
        </div>

        {/* 결과 */}
        <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px 16px' }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>grep: </span>
              <span style={{ color: '#ff6b6b', fontSize: 12 }}>no matches found</span>
            </div>
          ) : (
            filtered.map((post, i) => (
              <button
                key={post.slug}
                onClick={() => navigate(post)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  width: '100%', display: 'block', textAlign: 'left',
                  padding: '10px 16px',
                  background: i === activeIdx ? 'rgba(61,214,140,0.06)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {/* 경로 줄 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    color: i === activeIdx ? 'var(--green)' : 'var(--muted)',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {i === activeIdx ? '▸' : ' '}
                  </span>
                  <span style={{ color: 'var(--blue)', fontSize: 12 }}>
                    {toPath(post.slug)}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{
                    fontSize: 10, color: 'var(--green)', opacity: 0.7,
                    border: '1px solid rgba(61,214,140,0.25)',
                    borderRadius: 3, padding: '1px 6px',
                  }}>
                    {post.category}
                  </span>
                </div>
                {/* 제목 줄 */}
                <div style={{ paddingLeft: 20 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}># </span>
                  <span style={{
                    color: i === activeIdx ? '#fff' : 'var(--text)',
                    fontSize: 13, fontWeight: i === activeIdx ? 500 : 400,
                  }}>
                    {post.title}
                  </span>
                </div>
                {/* 태그 줄 */}
                {post.tags.length > 0 && (
                  <div style={{ paddingLeft: 20, marginTop: 2, display: 'flex', gap: 8 }}>
                    {post.tags.slice(0, 4).map((t) => (
                      <span key={t} style={{ color: 'var(--muted)', fontSize: 10 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* 하단 상태바 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 16px',
          borderTop: '1px solid var(--border)',
          background: '#1c1c24',
        }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 14 }}>
            {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([k, l]) => (
              <span key={k} style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{
                  background: 'var(--border)', border: '1px solid rgba(255,255,255,0.08)',
                  borderBottomWidth: 2, borderRadius: 3, padding: '1px 5px', fontSize: 10,
                }}>{k}</kbd>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
