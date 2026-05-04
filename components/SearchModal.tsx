'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/posts';

interface Props {
  posts: PostMeta[];
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ posts, open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
        p.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : posts.slice(0, 6);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 560,
          margin: '0 16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* 검색 입력 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: 14 }}>$</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--mono)',
              fontSize: 14,
            }}
          />
          <kbd
            onClick={onClose}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--muted)',
              background: 'var(--border)',
              borderRadius: 4,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            esc
          </kbd>
        </div>

        {/* 결과 */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px 16px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
              no results found.
            </div>
          ) : (
            filtered.map((post) => (
              <button
                key={post.slug}
                onClick={() => { router.push(`/posts/${post.slug}`); onClose(); }}
                style={{
                  width: '100%',
                  display: 'block',
                  padding: '12px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>
                  {post.title}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {post.date}
                  </span>
                  {post.tags.map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--purple)' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
