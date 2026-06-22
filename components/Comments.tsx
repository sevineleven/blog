'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getIdentity,
  setIdentity as persistIdentity,
  regenerate,
  setCustomName,
  emojiForAuthor,
  type Identity,
} from '@/lib/identity';

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  is_owner: boolean;
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

const mono = { fontFamily: 'var(--mono)' } as const;

// 오너(글쓴이) — 깃허브 아바타 + 고정 이름. is_owner 댓글은 이걸로 렌더한다.
const OWNER_NAME = 'sevineleven';
const OWNER_AVATAR = 'https://github.com/sevineleven.png?size=80';
const OWNER_KEY = 'blog_owner_key';

function ownerKey(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || '';
  } catch {
    return '';
  }
}

function OwnerAvatar({ size = 18 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={OWNER_AVATAR}
      alt={OWNER_NAME}
      width={size}
      height={size}
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
    />
  );
}

function IdentityBar({
  identity,
  onChange,
}: {
  identity: Identity;
  onChange: (next: Identity) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.author);

  function save() {
    const next = setCustomName(draft);
    if (next) onChange(next);
    setEditing(false);
  }

  if (editing) {
    return (
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          autoFocus
          value={draft}
          maxLength={20}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            ...mono,
            fontSize: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '2px 8px',
            color: 'var(--text)',
            outline: 'none',
            width: 140,
          }}
        />
        <button onClick={save} style={{ ...mono, fontSize: 12, color: 'var(--green)', background: 'transparent', border: 'none', cursor: 'pointer' }}>저장</button>
        <button onClick={() => setEditing(false)} style={{ ...mono, fontSize: 12, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>취소</button>
      </span>
    );
  }

  return (
    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...mono, fontSize: 12, color: 'var(--muted)' }}>
        {identity.emoji} {identity.author}
      </span>
      <button
        onClick={() => onChange(regenerate())}
        title="랜덤 이름 다시 뽑기"
        style={{ ...mono, fontSize: 13, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >🎲</button>
      <button
        onClick={() => { setDraft(identity.author); setEditing(true); }}
        title="이름 직접 입력"
        style={{ ...mono, fontSize: 12, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >✎</button>
    </span>
  );
}

function CommentItem({
  c,
  isReply,
  onReply,
}: {
  c: Comment;
  isReply: boolean;
  onReply?: () => void;
}) {
  return (
    <div style={{ padding: '14px 0', borderBottom: isReply ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {c.is_owner ? (
          <>
            <OwnerAvatar />
            <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>{c.author}</span>
            <span style={{ ...mono, fontSize: 10, color: 'var(--purple)', border: '1px solid rgba(183,148,244,0.4)', borderRadius: 3, padding: '0 5px' }}>글쓴이</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 15 }}>{emojiForAuthor(c.author)}</span>
            <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>{c.author}</span>
          </>
        )}
        <span style={{ ...mono, fontSize: 11, color: 'var(--muted)' }}>{formatDate(c.created_at)}</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{c.body}</p>
      {onReply && (
        <button
          onClick={onReply}
          style={{ ...mono, fontSize: 11, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0 0', marginTop: 2 }}
        >↳ 답글</button>
      )}
    </div>
  );
}

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [identity, setIdentityState] = useState<Identity | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [ownerMode, setOwnerMode] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIdentityState(getIdentity());
    setOwnerMode(!!ownerKey());
    fetch(`/api/comments?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); });
  }, [slug]);

  // 글쓴이 모드는 footer 의 숨은 토글(OwnerToggle)이 켜고 끈다 — 이벤트로 동기화.
  useEffect(() => {
    const onOwnerChange = (e: Event) => setOwnerMode(!!(e as CustomEvent).detail?.on);
    window.addEventListener('owner-mode-change', onOwnerChange);
    return () => window.removeEventListener('owner-mode-change', onOwnerChange);
  }, []);

  const tops = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  async function post(text: string, parent_id: string | null) {
    if (!text.trim() || !identity) return null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const key = ownerKey();
    if (key) headers['x-owner-secret'] = key; // 서버가 ADMIN_SECRET 과 대조해 글쓴이로 박는다
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_slug: slug, author: identity.author, body: text, parent_id }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Comment;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !identity) return;
    setSubmitting(true);
    setError('');
    const created = await post(body, null);
    if (created) {
      setComments((prev) => [...prev, created]);
      setBody('');
    } else {
      setError('전송 실패. 다시 시도해줘.');
    }
    setSubmitting(false);
  }

  async function submitReply(parentId: string) {
    if (replySubmitting || !replyBody.trim() || !identity) return;
    setReplySubmitting(true);
    const created = await post(replyBody, parentId);
    if (created) {
      setComments((prev) => [...prev, created]);
      setReplyBody('');
      setReplyTo(null);
    } else {
      setError('답글 전송 실패. 다시 시도해줘.');
    }
    setReplySubmitting(false);
  }

  function onIdentityChange(next: Identity) {
    persistIdentity(next);
    setIdentityState(next);
  }

  return (
    <div id="comments" style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ ...mono, fontSize: 12, color: 'var(--muted)' }}>cat comments/{slug}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ ...mono, fontSize: 11, color: 'var(--muted)' }}>
          {tops.length} {tops.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {tops.length === 0 ? (
        <p style={{ ...mono, fontSize: 13, color: 'var(--muted)', paddingBottom: 28 }}>no comments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tops.map((c) => {
            const replies = repliesOf(c.id);
            return (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <CommentItem c={c} isReply={false} onReply={() => { setReplyTo(c.id); setReplyBody(''); }} />

              {replies.length > 0 && (
                <div style={{ marginLeft: 24, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                  {replies.map((r) => (
                    <CommentItem key={r.id} c={r} isReply />
                  ))}
                </div>
              )}

              {replyTo === c.id && (
                <div style={{ marginLeft: 24, paddingLeft: 16, paddingBottom: 16 }}>
                  <textarea
                    autoFocus
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`${ownerMode ? OWNER_NAME : (identity?.author ?? '')} (으)로 답글...`}
                    maxLength={1000}
                    rows={2}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                      padding: '8px 12px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)',
                      outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.65,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button onClick={() => setReplyTo(null)} style={{ ...mono, fontSize: 12, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>취소</button>
                    <button
                      onClick={() => submitReply(c.id)}
                      disabled={replySubmitting || !replyBody.trim()}
                      style={{ ...mono, fontSize: 12, color: 'var(--green)', background: 'transparent', border: '1px solid rgba(61,214,140,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                    >&gt; 답글</button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      <form onSubmit={submit} style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ ...mono, fontSize: 12, color: 'var(--muted)' }}>write comment</span>
          {ownerMode ? (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <OwnerAvatar />
              <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>{OWNER_NAME}</span>
              <span style={{ ...mono, fontSize: 10, color: 'var(--purple)' }}>글쓴이</span>
            </span>
          ) : (
            identity && <IdentityBar identity={identity} onChange={onIdentityChange} />
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
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 12px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)',
              outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.65, transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(61,214,140,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {error && <span style={{ ...mono, fontSize: 12, color: '#ff6b6b' }}>{error}</span>}
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="submit"
                disabled={submitting || !body.trim() || !identity}
                style={{
                  ...mono, fontSize: 12,
                  color: submitting ? 'var(--muted)' : 'var(--green)',
                  background: 'transparent', border: '1px solid',
                  borderColor: submitting ? 'var(--border)' : 'rgba(61,214,140,0.3)',
                  borderRadius: 6, padding: '6px 16px',
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
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
