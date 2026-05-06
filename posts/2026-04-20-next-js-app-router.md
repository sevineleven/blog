---
title: "Next.js App Router 제대로 이해하기"
date: 2026-04-20T02:08:00Z
category: 프론트엔드
tags: [프론트엔드]
excerpt: "Page Router 쓰다가 App Router로 넘어오면서 한동안 계속 헷갈렸던 것들."
draft: false
---

Pages Router 쓰다가 App Router로 넘어왔을 때 제일 당황스러운 게 있었다.

컴포넌트에 `onClick` 달았더니 에러가 났다. 분명 React인데 왜? 처음엔 뭔가 설정을 잘못한 줄 알았다.

## 모든 컴포넌트가 기본적으로 Server다

App Router에서 핵심은 이거다. `'use client'`를 명시하지 않으면 전부 Server Component.

서버에서만 돌아가는 컴포넌트니까 `onClick`도 없고, `useState`도 없다. 처음엔 제약처럼 느껴졌는데 익숙해지고 나면 오히려 편하다. DB 직접 읽고, 환경변수 바로 쓰고, 번들 크기도 줄고.

```tsx
// Server Component - async도 그냥 됨
async function PostList() {
  const posts = await db.getPosts();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Client Component - 파일 맨 위에 이게 있어야 함
'use client';
function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(true)}>♥</button>;
}
```

기준은 단순하다. **이벤트 핸들러나 useState 쓰면 Client, 아니면 Server.**

## generateStaticParams 빌드타임에 페이지 다 만들어두기

이 블로그도 이렇게 쓰고 있다.

```tsx
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

빌드할 때 모든 포스트 페이지를 미리 만들어두니까, 방문자가 들어오면 그냥 HTML 던져주면 된다. 빠를 수밖에.

## 삽질 포인트

`'use client'`로 감싼 컴포넌트 안에 Server Component를 직접 import하면 안 된다. Client 안에 Server 못 넣음. 반대로 Server 안에 Client는 된다.

그리고 `cookies()`나 `headers()` 쓰는 순간 해당 페이지 전체가 동적 렌더링으로 전환된다. 의도치 않게 정적 생성이 날아가는 경우가 있어서 주의.
