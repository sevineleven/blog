# 설계: 좋아요 · 댓글 이름 변경 · 대댓글

날짜: 2026-06-22
상태: 승인됨 (사용자 확인)

## 목표

익명 블로그(blog.sevin.dev, Next.js 16 App Router + Supabase)에 세 기능을 추가한다.

1. **게시글 좋아요** — 글 하단에서 좋아요/취소. localStorage 토글로 중복 방지.
2. **댓글 이름 변경** — 기존 랜덤 아이덴티티를 재생성(🎲)하거나 직접 입력(✎)으로 바꿀 수 있게.
3. **대댓글(1단계)** — 댓글에 답글을 달 수 있게. 답글의 답글은 같은 부모로 묶어 평면 표시.

새 npm 의존성 0개. 기존 Supabase 패턴(`post_views` 카운트, `comments` 테이블, `lib/identity.ts`)을 확장한다.

## 결정 사항 (확정)

- 좋아요 대상: **글에만** (댓글 좋아요 없음).
- 좋아요 중복 방지: **localStorage 토글** (서버 IP 추적 안 함).
- 이름 변경: **재생성 + 직접 입력 둘 다**.
- 대댓글 깊이: **1단계만**.

## 기존 코드 (확장 대상)

- `lib/identity.ts` — `{emoji, author}` 랜덤 생성, localStorage `blog_identity` 저장. `getIdentity()`, `emojiForAuthor()`, `generate()`(비공개) 존재.
- `lib/supabase.ts` — `supabase`(anon), `supabaseAdmin`(service role) 클라이언트.
- `app/api/comments/route.ts` — `GET ?slug=`(목록), `POST {post_slug, author, body}`, `DELETE ?id=`(admin secret). 신규 댓글 시 Resend 이메일 알림.
- `app/api/views/route.ts` — `post_views(slug, count)` upsert 카운트 패턴(참고용).
- `components/Comments.tsx` — 댓글 목록 + 작성 폼. `getIdentity()`로 작성자 표시.
- `app/posts/[slug]/page.tsx` — 글 상세. 헤더에 `ShareSheet`. 본문은 `ProseContent`.

## 데이터 모델 (Supabase) — 수동 마이그레이션

Supabase는 호스팅이라 코드에서 마이그레이션을 못 돌린다. 아래 SQL을 **Supabase SQL Editor에 붙여넣어 실행**한다(구현 산출물로 `.sql` 파일도 함께 제공).

```sql
-- 1) 게시글 좋아요 카운트 (post_views 와 동일 패턴)
create table if not exists post_likes (
  slug text primary key,
  count integer not null default 0
);

-- 2) 댓글에 부모 참조 추가 (1단계 대댓글)
alter table comments
  add column if not exists parent_id uuid
  references comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments(parent_id);
```

- `post_likes.count`는 0 미만으로 내려가지 않도록 서버에서 클램프.
- `parent_id`가 null이면 최상위 댓글, 값이 있으면 그 댓글의 답글.
- 부모 삭제(admin) 시 `ON DELETE CASCADE`로 답글도 함께 삭제.

## 컴포넌트 · API 설계

### A. 좋아요

**`app/api/likes/route.ts` (신규)**
- `GET` → `{ [slug]: count }` 맵 반환(목록/홈에서 일괄 표시용). `post_views` GET과 동일 형태.
- `POST { slug, action: 'like' | 'unlike' }` → 현재 count 읽어 ±1, `Math.max(0, …)` 클램프 후 upsert, `{ count }` 반환.
- 입력 검증: `slug` 필수, `action`은 두 값만 허용.

**`components/LikeButton.tsx` (신규, 클라이언트)**
- props: `slug`, (선택) `initialCount`.
- localStorage `blog_liked` = 좋아요 누른 slug 문자열 배열. 마운트 시 현재 slug 포함 여부로 liked 상태 결정.
- 하트 아이콘 + 카운트. 클릭 시: 낙관적으로 상태/카운트 토글 → API 호출 → 실패하면 롤백.
- 배치: 글 상세 본문 하단(공유 시트 근처). 블로그의 모노/터미널 톤에 맞춰 스타일.

### B. 이름 변경 (identity)

**`lib/identity.ts` 확장**
- `setIdentity(identity: Identity): void` — localStorage `blog_identity`에 저장.
- `regenerate(): Identity` — `generate()`로 새 랜덤 만들고 저장 후 반환.
- 커스텀 이름 입력 시 이모지는 `emojiForAuthor(name)`로 도출(기존 해시 폴백 활용). 빈 문자열/공백만 입력은 거부.

**`components/Comments.tsx` 내 아이덴티티 편집 UI**
- 폼 헤더의 `이모지 이름` 옆에 **🎲(재생성)**, **✎(직접 입력)** 컨트롤.
- ✎ 클릭 → 인라인 입력창 + 저장/취소. 저장 시 `setIdentity`, 헤더 즉시 갱신.
- 🎲 클릭 → `regenerate()`, 헤더 즉시 갱신.
- 변경은 **앞으로 작성할 (대)댓글부터** 적용. 기존 댓글의 `author`는 작성 시점 값으로 보존(로그인 없어 소급 변경 불가).

### C. 대댓글 (1단계)

**`app/api/comments/route.ts` 수정**
- `GET`: select에 `parent_id` 추가.
- `POST`: `parent_id`(선택) 수용. 값이 있으면 같은 `post_slug`의 기존 댓글인지 가볍게 검증 후 insert. 알림 이메일에 "답글" 맥락 포함.

**`components/Comments.tsx` 수정**
- GET 결과를 `parent_id`로 묶어 **1단계 트리** 구성: 최상위 댓글 배열 + 각 댓글의 답글 배열.
- 각 최상위 댓글에 **답글** 버튼 → 인라인 답글 폼(현재 아이덴티티 자동, 본문만 입력). 제출 시 `parent_id = 해당 최상위 댓글 id`.
- 답글에도 답글 버튼 표시 가능하나, `parent_id`는 항상 **최상위 댓글**로 설정(1단계 유지). 누구에게 다는지 맥락이 필요하면 답글 본문 앞에 `@상대이름`을 자동 프리필(선택, 단순화 위해 생략 가능).
- 답글은 부모 아래 한 단계 들여쓰기로 시간순 렌더. 모바일에서 들여쓰기 1단계라 가독성 유지.
- 카운트 표시("N entries")는 전체 댓글 수(답글 포함) 기준.

## 데이터 흐름

1. 글 상세 진입 → `LikeButton`이 `blog_liked`로 liked 상태 표시, count는 초기 GET(또는 props).
2. 좋아요 클릭 → 낙관적 토글 → `POST /api/likes` → 서버 count 확정.
3. 댓글/답글 작성 → `getIdentity()`의 author 사용 → `POST /api/comments`(+`parent_id`) → 목록에 반영.
4. 이름 변경 → `setIdentity`/`regenerate` → 이후 작성부터 새 이름.

## 엣지 케이스 · 한계

- **좋아요 동시성**: read-then-write upsert라 동시 클릭 시 일부 유실 가능. 기존 `post_views`와 동일 수준이며 저트래픽이라 수용. 추후 Supabase RPC 원자 증가로 교체 가능(범위 밖).
- **localStorage 불가 환경**: 좋아요 호출은 되지만 중복 방지가 느슨해짐(허용). 이름은 매번 새 랜덤.
- **빈/과길이 입력**: 본문 `maxLength` 유지, 공백만 제출 거부. 커스텀 이름도 트림 후 빈 값 거부, 길이 상한(예: 20자) 적용.
- **부모 삭제**: FK CASCADE로 답글 자동 삭제.
- **검증**: 답글 `parent_id`가 다른 글의 댓글이면 거부(또는 무시하고 최상위로). 단순화를 위해 같은 slug 확인만 한다.

## 산출물 목록

- SQL: `supabase/migrations/2026-06-22-likes-and-replies.sql` (수동 실행용)
- 신규: `app/api/likes/route.ts`, `components/LikeButton.tsx`
- 수정: `lib/identity.ts`, `app/api/comments/route.ts`, `components/Comments.tsx`, `app/posts/[slug]/page.tsx`(LikeButton 배치)

## 범위 밖 (YAGNI)

- 댓글 좋아요, 무한 중첩 답글, 본인 댓글 수정/삭제, IP 기반 중복 방지, 실시간(Realtime) 갱신.
