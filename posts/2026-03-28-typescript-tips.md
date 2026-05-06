---
title: "TypeScript 유용한 패턴들"
date: 2026-03-28T07:55:00Z
category: 프론트엔드
tags: [TypeScript, 프론트엔드, 개발]
excerpt: "쓸 때마다 '아 이게 있었지' 하고 찾아보게 되는 것들 모음."
draft: false
---

자주 쓰는데 매번 검색하게 되는 것들이 있다. 그냥 여기다 정리해둔다.

## Discriminated Union

상태 관리할 때 이게 없으면 불안하다.

```typescript
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };

function render(state: State) {
  if (state.status === 'success') {
    console.log(state.data); // 여기서 data가 자동으로 좁혀짐
  }
}
```

`status`로 분기하면 TypeScript가 알아서 타입을 좁혀준다. 에러 처리할 때 특히 유용하다.

## satisfies - as const랑 뭐가 다르냐면

솔직히 처음엔 `as const`랑 뭐가 다른지 몰랐다.

```typescript
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, string | number[]>;

palette.red.map(v => v * 2); // 이게 됨. as const 였으면 readonly라서 타입이 달라짐
```

`as const`는 전체를 readonly + literal 타입으로 좁히는데, `satisfies`는 타입 검사만 하고 추론은 그대로 살린다. 팔레트나 설정값처럼 구체적인 타입이 필요할 때 쓴다.

## infer

제네릭에서 타입을 "뽑아낼" 때.

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Result = UnwrapPromise<Promise<string>>; // string
```

API 응답 타입 다룰 때 자주 쓴다. 처음 보면 어색한데 익숙해지면 없으면 불편하다.

## Template Literal Types

이건 신기해서 넣었다.

```typescript
type EventName = `on${Capitalize<string>}`;
// 'onClick', 'onHover' 같은 패턴 강제
```

실무에서 이벤트 핸들러 이름 검증할 때 써봤는데 생각보다 유용했다.
