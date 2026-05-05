'use client';

import { useState } from 'react';

interface Comment {
  id: string;
  post_slug: string;
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

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [input, setInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/comments', {
      headers: { 'x-admin-secret': input.trim() },
    });

    if (res.ok) {
      const data = await res.json();
      setComments(data);
      setSecret(input.trim());
    } else {
      setError('access denied.');
    }
    setLoading(false);
  }

  async function deleteComment(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/comments?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleting(null);
  }

  // Group by post_slug
  const grouped = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (!acc[c.post_slug]) acc[c.post_slug] = [];
    acc[c.post_slug].push(c);
    return acc;
  }, {});

  if (!secret) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--muted)',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <span style={{ color: 'var(--green)' }}>sevin@blog:~$</span>
            <span>sudo access admin</span>
            <span style={{ color: 'var(--border)' }}>{'[sudo] password for sevin:'}</span>
          </div>

          <form onSubmit={unlock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)', flexShrink: 0 }}>
                &gt;
              </span>
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="enter admin secret"
                autoFocus
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(61,214,140,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#ff6b6b', paddingLeft: 22 }}>
                {error}
              </span>
            )}

            <div style={{ paddingLeft: 22 }}>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: loading ? 'var(--muted)' : 'var(--green)',
                  background: 'transparent',
                  border: '1px solid',
                  borderColor: loading ? 'var(--border)' : 'rgba(61,214,140,0.3)',
                  borderRadius: 6,
                  padding: '6px 18px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {loading ? 'authenticating...' : '> authenticate'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            ls -la comments/ | sort -r
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', paddingLeft: 22 }}>
          total {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* 댓글 없음 */}
      {comments.length === 0 && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>
          no comments found.
        </p>
      )}

      {/* 포스트별 그룹 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {Object.entries(grouped).map(([slug, list]) => (
          <div key={slug}>
            {/* 포스트 슬러그 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue)' }}>
                /{slug}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                ({list.length})
              </span>
            </div>

            {/* 댓글 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {list.map((c) => (
                <div key={c.id} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>
                        {c.author}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text)',
                      lineHeight: 1.65,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {c.body}
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => deleteComment(c.id)}
                    disabled={deleting === c.id}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: deleting === c.id ? 'var(--muted)' : '#ff6b6b',
                      background: 'transparent',
                      border: '1px solid',
                      borderColor: deleting === c.id ? 'var(--border)' : 'rgba(255,107,107,0.25)',
                      borderRadius: 5,
                      padding: '4px 10px',
                      cursor: deleting === c.id ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (deleting !== c.id) e.currentTarget.style.borderColor = 'rgba(255,107,107,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      if (deleting !== c.id) e.currentTarget.style.borderColor = 'rgba(255,107,107,0.25)';
                    }}
                  >
                    {deleting === c.id ? 'rm...' : 'rm'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
