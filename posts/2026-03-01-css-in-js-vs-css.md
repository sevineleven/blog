---
title: "CSS-in-JS vs 순수 CSS, 뭘 써야 할까"
date: 2026-03-01T11:17:00Z
category: 프론트엔드
tags: [CSS, 프론트엔드]
excerpt: "styled-components 쓰다가 App Router에서 막혀서 결국 갈아엎은 이야기."
draft: false
---

이 블로그 만들면서 스타일 어떻게 할지 한참 고민했다.

처음엔 styled-components 쓰려고 했다. 익숙하기도 하고, 변수 쓰기 편하고. 근데 Next.js App Router에서 Server Component에 styled-components 붙이려니까 바로 막혔다. 런타임에 스타일을 주입하는 구조라 Server Component에서 못 쓴다. `'use client'` 달면 되긴 하는데 그러면 Server Component 쓰는 의미가 줄어든다.

그래서 결국 **인라인 style + CSS 클래스** 조합으로 갔다.

```tsx
// 테마 값은 CSS 변수로
<div style={{ color: 'var(--green)' }} />

// hover, active 같은 상태는 CSS 클래스로
<button className="nav-link active" />
```

동적인 값은 CSS custom properties로 처리하고, 인터랙션은 클래스로 다루면 Server Component에서도 문제없다.

## Tailwind는 언제?

팀 프로젝트에서 디자인 시스템 없이 빠르게 치고 나가야 할 때는 좋다. 유틸리티 클래스 외우는 비용보다 빠른 게 맞다.

근데 혼자 하는 프로젝트에서는 솔직히 `w-full flex items-center justify-between gap-4` 이런 거 쓰면서 내가 뭘 하는 건지 가끔 잃는 느낌이 든다. 이건 그냥 취향 차이인 것 같다.

## 결론이랄 게 없는 결론

정답은 없다. App Router 쓰면서 CSS-in-JS 계열은 제약이 생기고, 그 제약이 싫으면 다른 방법을 쓰면 된다. 이 블로그는 그 과정에서 인라인 + CSS 변수가 제일 맞았다.
