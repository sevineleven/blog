# 좋아요 · 댓글 이름 변경 · 대댓글 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 익명 블로그에 게시글 좋아요(localStorage 토글), 댓글 작성자 이름 변경(재생성+직접입력), 1단계 대댓글을 추가한다.

**Architecture:** 기존 Supabase 패턴을 확장한다. 좋아요는 `post_views`와 동일한 카운트 테이블(`post_likes`), 대댓글은 `comments` 테이블에 `parent_id` 컬럼 1개, 이름 변경은 `lib/identity.ts`에 setter 추가. 새 npm 의존성 0개.

**Tech Stack:** Next.js 16 App Router(route handlers), Supabase(@supabase/supabase-js), React client components, TypeScript. 테스트 러너 없음 → 검증은 `npx tsc --noEmit` + 로컬 dev 서버(:3000) curl + `npm run build`.

**전제:** 로컬 dev 서버가 `:3000`에서 실행 중이어야 한다(`npx next dev -p 3000`). Supabase 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)가 `.env.local`에 설정돼 있어야 한다.

---

## 파일 구조

- Create: `supabase/migrations/2026-06-22-likes-and-replies.sql` — 수동 실행 SQL (post_likes 테이블 + comments.parent_id)
- Modify: `lib/identity.ts` — `setIdentity`, `regenerate`, `setCustomName` 추가
- Create: `app/api/likes/route.ts` — 좋아요 GET(맵)/POST(토글)
- Create: `components/LikeButton.tsx` — 좋아요 버튼(클라, localStorage 중복방지)
- Modify: `app/posts/[slug]/page.tsx` — 본문 하단에 LikeButton 배치
- Modify: `app/api/comments/route.ts` — GET/POST에 `parent_id` 반영
- Modify: `components/Comments.tsx` — 이름 편집 UI + 1단계 대댓글 렌더/작성

---

## Task 1: Supabase 마이그레이션 SQL (수동 실행)

**Files:**
- Create: `supabase/migrations/2026-06-22-likes-and-replies.sql`

- [ ] **Step 1: SQL 파일 작성**

Create `supabase/migrations/2026-06-22-likes-and-replies.sql`:

```sql
-- 좋아요 · 대댓글 마이그레이션 (2026-06-22)
-- Supabase SQL Editor 에 붙여넣어 실행한다 (호스팅이라 코드에서 자동 실행 불가).

-- 1) 게시글 좋아요 카운트 (post_views 와 동일 패턴)
create table if not exists post_likes (
  slug text primary key,
  count integer not null default 0
);

-- 2) 댓글에 부모 참조 추가 (1단계 대댓글). 부모 삭제 시 답글도 함께 삭제.
alter table comments
  add column if not exists parent_id uuid
  references comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments(parent_id);
```

- [ ] **Step 2: Supabase에서 실행 (수동)**

Supabase 대시보드 → SQL Editor → 위 파일 내용 붙여넣기 → Run.
Expected: "Success. No rows returned". Table Editor에서 `post_likes` 테이블과 `comments.parent_id` 컬럼 확인.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/2026-06-22-likes-and-replies.sql
git commit -m "chore: 좋아요·대댓글 supabase 마이그레이션 SQL"
```

---

## Task 2: identity.ts — 이름 변경 함수 추가

**Files:**
- Modify: `lib/identity.ts` (끝부분, `getIdentity` 아래에 추가)

- [ ] **Step 1: setter 함수 추가**

`lib/identity.ts` 맨 끝(`getIdentity` 함수 다음)에 추가:

```ts
const MAX_NAME = 20;

// 현재 아이덴티티를 localStorage 에 저장한다.
export function setIdentity(identity: Identity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {}
}

// 새 랜덤 아이덴티티를 만들어 저장하고 반환한다 (🎲 재생성).
export function regenerate(): Identity {
  const identity = generate();
  setIdentity(identity);
  return identity;
}

// 직접 입력한 이름으로 아이덴티티를 만든다. 이모지는 이름에서 도출.
// 트림 후 빈 값이면 null (호출부가 무시). 길이 상한 MAX_NAME.
export function setCustomName(name: string): Identity | null {
  const trimmed = name.trim().slice(0, MAX_NAME);
  if (!trimmed) return null;
  const identity: Identity = { author: trimmed, emoji: emojiForAuthor(trimmed) };
  setIdentity(identity);
  return identity;
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0).

- [ ] **Step 3: 커밋**

```bash
git add lib/identity.ts
git commit -m "feat: identity 이름 변경 함수(setIdentity·regenerate·setCustomName)"
```

---

## Task 3: 좋아요 API 라우트

**Files:**
- Create: `app/api/likes/route.ts`

- [ ] **Step 1: 라우트 작성**

Create `app/api/likes/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 전체 좋아요 맵 { slug: count } — 홈/목록 일괄 표시용. post_views GET 과 동일 형태.
export async function GET() {
  const { data, error } = await supabase.from('post_likes').select('slug, count');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map = Object.fromEntries((data ?? []).map((v) => [v.slug, v.count]));
  return NextResponse.json(map);
}

// 좋아요 토글. action 으로 ±1, 0 미만으로는 안 내려간다. 중복 방지는 클라(localStorage) 책임.
export async function POST(req: NextRequest) {
  const { slug, action } = await req.json();
  if (!slug || (action !== 'like' && action !== 'unlike')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { data: current } = await supabase
    .from('post_likes')
    .select('count')
    .eq('slug', slug)
    .single();

  const delta = action === 'like' ? 1 : -1;
  const newCount = Math.max(0, (current?.count ?? 0) + delta);

  const { error } = await supabase.from('post_likes').upsert({ slug, count: newCount });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: newCount });
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: API 동작 확인 (Task 1 SQL 실행 후)**

Run:
```bash
curl -s -X POST localhost:3000/api/likes -H 'Content-Type: application/json' -d '{"slug":"__test__","action":"like"}'
curl -s localhost:3000/api/likes
curl -s -X POST localhost:3000/api/likes -H 'Content-Type: application/json' -d '{"slug":"__test__","action":"unlike"}'
```
Expected: 첫 호출 `{"count":1}`, GET에 `"__test__":1` 포함, 마지막 `{"count":0}`. (음수 방지 확인: unlike를 한 번 더 호출해도 `{"count":0}`)

- [ ] **Step 4: 커밋**

```bash
git add app/api/likes/route.ts
git commit -m "feat: 좋아요 API(/api/likes) — 맵 조회 + 토글"
```

---

## Task 4: LikeButton 컴포넌트

**Files:**
- Create: `components/LikeButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `components/LikeButton.tsx`:

```tsx
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
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/LikeButton.tsx
git commit -m "feat: LikeButton 컴포넌트(localStorage 토글·낙관적 업데이트)"
```

---

## Task 5: 글 상세에 LikeButton 배치

**Files:**
- Modify: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: import 추가**

`app/posts/[slug]/page.tsx` 상단 import 블록에서 `ProseContent` import 아래 줄에 추가:

```tsx
import LikeButton from '@/components/LikeButton';
```

- [ ] **Step 2: 본문 바로 아래에 배치**

`app/posts/[slug]/page.tsx`에서 본문 렌더 줄을 찾는다:

```tsx
      {/* 본문 */}
      <ProseContent html={post.content} />
```

바로 아래에 LikeButton을 추가한다:

```tsx
      {/* 본문 */}
      <ProseContent html={post.content} />

      {/* 좋아요 */}
      <LikeButton slug={slug} />
```

- [ ] **Step 3: 렌더 확인**

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/posts/piki-admin-slack-ip-gate"`
Expected: `200`. 브라우저에서 글 하단에 하트 버튼이 보이고 클릭 시 카운트 증가/감소.

- [ ] **Step 4: 커밋**

```bash
git add "app/posts/[slug]/page.tsx"
git commit -m "feat: 글 상세 하단에 좋아요 버튼 배치"
```

---

## Task 6: 댓글 API에 parent_id 반영

**Files:**
- Modify: `app/api/comments/route.ts`

- [ ] **Step 1: GET select에 parent_id 추가**

`app/api/comments/route.ts`의 GET에서:

```ts
  const { data, error } = await supabase
    .from('comments')
    .select('id, author, body, created_at')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });
```

를 다음으로 바꾼다 (`parent_id` 추가):

```ts
  const { data, error } = await supabase
    .from('comments')
    .select('id, author, body, created_at, parent_id')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });
```

- [ ] **Step 2: POST에서 parent_id 수용 + 같은 글 검증**

`app/api/comments/route.ts`의 POST 본문을 다음으로 교체한다:

```ts
export async function POST(req: NextRequest) {
  try {
    const { post_slug, author, body, parent_id } = await req.json();
    if (!post_slug || !author?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    // 답글이면 부모가 같은 글의 댓글인지 가볍게 검증 (아니면 최상위로 떨군다)
    let parentId: string | null = null;
    if (parent_id) {
      const { data: parent } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_slug', post_slug)
        .single();
      parentId = parent?.id ?? null;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_slug, author: author.trim(), body: body.trim(), parent_id: parentId, password_hash: '' })
      .select('id, author, body, created_at, parent_id')
      .single();

    if (error) { console.error('[POST comments]', error); return NextResponse.json({ error: error.message }, { status: 500 }); }

    resend?.emails.send({
      from: 'blog@sevin.dev',
      to: process.env.NOTIFICATION_EMAIL!,
      subject: `[블로그] ${parentId ? '새 답글' : '새 댓글'} - ${post_slug}`,
      text: `${data.author}: ${data.body.slice(0, 100)}\n\nhttps://blog.sevin.dev/posts/${post_slug}#comments`,
    }).catch((e) => console.error('[notify comment]', e));

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[POST comments] unexpected', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 동작 확인 (Task 1 SQL 실행 후)**

Run:
```bash
curl -s -X POST localhost:3000/api/comments -H 'Content-Type: application/json' -d '{"post_slug":"__test__","author":"테스트 사자","body":"부모 댓글"}'
```
Expected: `{"id":"...","author":"테스트 사자","body":"부모 댓글","created_at":"...","parent_id":null}` (201). 반환된 `id`를 복사해 답글 작성:
```bash
curl -s -X POST localhost:3000/api/comments -H 'Content-Type: application/json' -d '{"post_slug":"__test__","author":"테스트 여우","body":"답글","parent_id":"<위 id>"}'
```
Expected: `parent_id`가 그 id로 채워진 객체. `curl -s "localhost:3000/api/comments?slug=__test__"`에 두 댓글이 `parent_id` 포함해 보임.

- [ ] **Step 5: 커밋**

```bash
git add app/api/comments/route.ts
git commit -m "feat: 댓글 API에 parent_id(대댓글) 반영 + 같은 글 검증"
```

---

## Task 7: Comments 컴포넌트 — 이름 편집 + 대댓글

**Files:**
- Modify: `components/Comments.tsx` (전체 교체)

이 태스크는 `components/Comments.tsx`를 통째로 교체한다. (이름 편집 UI와 대댓글 트리가 같은 파일에서 상태를 공유하므로 분리하지 않는다.)

- [ ] **Step 1: Comments.tsx 전체 교체**

`components/Comments.tsx`의 전체 내용을 다음으로 교체한다:

```tsx
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

// 현재 아이덴티티 표시 + 변경(🎲 재생성 / ✎ 직접 입력)
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

// 댓글/답글 한 줄
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
        <span style={{ fontSize: 15 }}>{emojiForAuthor(c.author)}</span>
        <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>{c.author}</span>
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIdentityState(getIdentity());
    fetch(`/api/comments?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); });
  }, [slug]);

  // 최상위 + 답글 1단계 트리
  const tops = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  async function post(text: string, parent_id: string | null) {
    if (!text.trim() || !identity) return null;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (!replyBody.trim() || !identity) return;
    const created = await post(replyBody, parentId);
    if (created) {
      setComments((prev) => [...prev, created]);
      setReplyBody('');
      setReplyTo(null);
    } else {
      setError('답글 전송 실패. 다시 시도해줘.');
    }
  }

  function onIdentityChange(next: Identity) {
    persistIdentity(next);
    setIdentityState(next);
  }

  return (
    <div id="comments" style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
      {/* 섹션 레이블 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ ...mono, fontSize: 12, color: 'var(--muted)' }}>cat comments/{slug}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ ...mono, fontSize: 11, color: 'var(--muted)' }}>
          {comments.length} {comments.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* 댓글 목록 */}
      {tops.length === 0 ? (
        <p style={{ ...mono, fontSize: 13, color: 'var(--muted)', paddingBottom: 28 }}>no comments yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tops.map((c) => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <CommentItem c={c} isReply={false} onReply={() => { setReplyTo(c.id); setReplyBody(''); }} />

              {/* 답글들 (1단계 들여쓰기) */}
              {repliesOf(c.id).length > 0 && (
                <div style={{ marginLeft: 24, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                  {repliesOf(c.id).map((r) => (
                    <CommentItem key={r.id} c={r} isReply />
                  ))}
                </div>
              )}

              {/* 답글 작성 폼 */}
              {replyTo === c.id && (
                <div style={{ marginLeft: 24, paddingLeft: 16, paddingBottom: 16 }}>
                  <textarea
                    autoFocus
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`${identity?.author ?? ''} (으)로 답글...`}
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
                      disabled={!replyBody.trim()}
                      style={{ ...mono, fontSize: 12, color: 'var(--green)', background: 'transparent', border: '1px solid rgba(61,214,140,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                    >&gt; 답글</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 작성 폼 */}
      <form onSubmit={submit} style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ ...mono, fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ ...mono, fontSize: 12, color: 'var(--muted)' }}>write comment</span>
          {identity && <IdentityBar identity={identity} onChange={onIdentityChange} />}
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
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 렌더/동작 확인**

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/posts/piki-admin-slack-ip-gate"`
Expected: `200`.
브라우저 확인: (1) 폼 헤더에 `이모지 이름` 옆 🎲·✎ 보임, 🎲 누르면 이름 바뀜, ✎로 직접 입력·저장됨. (2) 댓글에 "↳ 답글" 버튼, 클릭 시 인라인 답글 폼, 작성하면 부모 아래 1단계 들여쓰기로 표시.

- [ ] **Step 4: 커밋**

```bash
git add components/Comments.tsx
git commit -m "feat: 댓글 이름 변경(재생성·직접입력) + 1단계 대댓글 UI"
```

---

## Task 8: 빌드 게이트 + 테스트 데이터 정리

**Files:** (없음 — 검증/정리만)

- [ ] **Step 1: 프로덕션 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공(에러 없음). lint/타입 통과.

- [ ] **Step 2: 테스트 데이터 정리 (선택)**

Task 3·6에서 만든 `__test__` 좋아요/댓글을 Supabase Table Editor에서 삭제한다(`post_likes`의 `__test__` 행, `comments`의 `post_slug = __test__` 행).

- [ ] **Step 3: 푸시**

```bash
git push origin main
```
Expected: main 반영. Vercel 재배포.

---

## 검증 체크리스트 (전체)

- [ ] Supabase에 `post_likes` 테이블, `comments.parent_id` 컬럼 존재
- [ ] 글 하단 좋아요 토글, 새로고침해도 liked 유지, 카운트 0 미만 안 됨
- [ ] 댓글 폼에서 🎲 재생성·✎ 직접 입력으로 이름 변경, 이후 작성 댓글에 반영
- [ ] 댓글에 답글 작성 → 부모 아래 1단계 들여쓰기 표시
- [ ] `npm run build` 성공
