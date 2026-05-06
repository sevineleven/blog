'use client';

import { useEffect, useState, useRef } from 'react';
import { getIdentity, emojiForAuthor, type Identity } from '@/lib/identity';

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dy = String(kst.getUTCDate()).padStart(2, '0');
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const mi = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${dy} ${h}:${mi} KST`;
}

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIdentity(getIdentity());
    fetch(`/api/comments?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); });
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !identity) return;
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_slug: slug, author: identity.author, body }),
    });

    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody('');
    } else {
      setError('전송 실패. 다시 시도해줘.');
    }
    setSubmitting(false);
  }

  return (
    <div id="comments" style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
      {/* 섹션 레이블 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          cat comments/{slug}
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
          {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', paddingBottom: 28 }}>
          no comments yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {comments.map((c) => (
            <div key={c.id} style={{
              padding: '18px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>{emojiForAuthor(c.author)}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>
                  {c.author}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 작성 폼 */}
      <form onSubmit={submit} style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            write comment
          </span>
          {identity && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
              {identity.emoji} {identity.label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="leave a comment..."
            maxLength={1000}
            rows={4}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '8px 12px',
              fontFamily: 'var(--sans)',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
              width: '100%',
              resize: 'vertical',
              lineHeight: 1.65,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(61,214,140,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {error && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#ff6b6b' }}>
                {error}
              </span>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="submit"
                disabled={submitting || !body.trim() || !identity}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: submitting ? 'var(--muted)' : 'var(--green)',
                  background: 'transparent',
                  border: '1px solid',
                  borderColor: submitting ? 'var(--border)' : 'rgba(61,214,140,0.3)',
                  borderRadius: 6,
                  padding: '6px 16px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {submitting ? 'sending...' : '> submit'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
