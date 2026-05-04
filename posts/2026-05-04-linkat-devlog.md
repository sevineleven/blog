---
title: "linkat 개발기 - 링크 아카이빙 서비스"
date: 2026-05-04T10:00:00Z
category: 사이드프로젝트
tags: [Next.js, Supabase, 크롬익스텐션, 사이드프로젝트]
excerpt: "브라우징 중에 링크를 저장하는 게 이렇게 귀찮을 줄 몰랐다. 그래서 직접 만들었다."
draft: false
---

![linkat 로고](/linkat-logo.png)

## 시작은 귀찮음이었다

웹 서핑을 하다 보면 나중에 다시 보고 싶은 페이지가 생긴다. 근데 막상 저장하려면 번거롭다. 브라우저 북마크는 금방 쌓여서 못 찾고, 노션에 옮기자니 컨텍스트 스위칭이 싫었다.

그냥 지금 보고 있는 페이지에서 버튼 하나 눌러서 저장되면 안 되나?

그게 **linkat**을 만들게 된 이유다.

## 크롬 익스텐션이 핵심이었다

처음엔 웹앱만 생각했다. URL 붙여넣기 → 저장. 근데 만들다 보니까 이건 의미가 없었다. 어차피 링크를 저장하려면 URL을 복사하고, 탭을 바꾸고, 붙여넣기 하는 과정이 필요한데 — 그게 북마크보다 더 귀찮다.

진짜 해결책은 **지금 보고 있는 페이지에서 바로 저장**이었다. 그러려면 크롬 익스텐션이 필요했다.

**Manifest V3**로 만들었다. 구조는 단순하다.

- `content.js`: 모든 페이지에 인젝트되어 플로팅 UI를 띄움
- `popup.js`: 익스텐션 아이콘 클릭 시 저장 팝업
- `background.js`: `Alt+S` 단축키 처리

빌드 툴 없이 **바닐라 JS**로 썼다. 어차피 규모가 작고, 번들러 세팅하는 시간에 기능을 하나 더 만드는 게 낫겠다 싶었다.

## 기술 스택 선택

웹앱은 **Next.js 15 App Router** + TypeScript. 백엔드는 `Next.js API Routes`로 같이 처리했다. 서버 따로 안 둬도 되는 게 서버리스 배포랑 잘 맞았다.

DB는 **Supabase**. PostgreSQL인데 인증까지 같이 해결해준다. Google OAuth를 몇 줄로 붙일 수 있어서 선택했다. **RLS(Row Level Security)**로 유저별 데이터 격리도 DB 레벨에서 처리된다.

배포는 **Vercel**. 레포 연결해두면 `push`할 때마다 자동 배포된다.

## 고양이 디자인이 제일 어려웠다

솔직히 기능보다 고양이 디자인에 시간을 더 썼다.

처음엔 SVG로 직접 그렸다. 타원이랑 삼각형 조합으로 얼굴 모양을 만들었는데 — 고양이가 아니라 물개처럼 생겼다. 색깔도 보라색이어서 더 이상했다.

여러 번 뜯어고치다가 결국 이미지를 쓰기로 했다. 고양이 상태별 디자인은 **ChatGPT**에 맡겼다. "픽셀 고양이, 링크 저장 중인 모습" 이런 식으로 프롬프트를 주면 꽤 잘 뽑아줬다. **상태별로 5개** — `idle`, `hover`, `click`, `saving`, `saved`. 이걸 Python `PIL`로 잘라서 배경을 제거했다.

```python
# BFS flood fill로 흰 배경 제거
def remove_background(img, tolerance=28):
    pixels = img.load()
    h, w = img.size[1], img.size[0]
    queue = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
    visited = set()
    while queue:
        x, y = queue.pop()
        if (x, y) in visited: continue
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        if max(r, g, b) > 255 - tolerance:
            pixels[x, y] = (0, 0, 0, 0)
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = x+dx, y+dy
                if 0 <= nx < w and 0 <= ny < h:
                    queue.append((nx, ny))
```

**가장자리부터 연결된 흰 픽셀만 날리고**, 고양이 몸 안의 흰 부분은 유지하는 방식이다. 잘라내는 좌표도 `numpy`로 픽셀 밀도를 분석해서 찾았다. 이미지 자르는 작업에 삽질을 꽤 했다.

## 중간에 방향을 바꿨다

초기 기획에 **포인트 시스템**이 있었다. 링크 저장할 때마다 포인트를 주고, 고양이 방을 꾸밀 수 있는 상점도 만들었다. 게임화 루프를 넣으면 재미있을 것 같았다.

근데 만들다 보니까 이게 오히려 서비스의 핵심을 흐렸다. 링크 저장이 목적인데 포인트 때문에 저장하는 구조가 되면 이상하다. 상점 UI도 만들다가 "이게 왜 필요하지?"라는 생각이 계속 들었다.

그래서 **포인트 시스템을 전부 걷어냈다**. 게스트 모드도 마찬가지였다. "로그인 없이도 써볼 수 있게 하자"는 생각으로 만들었는데, 결국 `localStorage` 링크가 클라우드로 안 넘어가고 UX만 복잡해졌다. 크롬 익스텐션으로 홍보할 서비스라 어차피 익스텐션 설치하면 로그인부터 해야 하는데, 게스트 로직을 유지할 이유가 없었다.

코드가 훨씬 단순해졌다.

## 파비콘 하나도 쉽지 않았다

링크 저장 시 파비콘을 같이 보여주고 싶었다. **Google Favicon API**를 쓰면 된다고 생각했다.

```
https://www.google.com/s2/favicons?domain={hostname}&sz=32
```

대부분의 사이트에선 잘 됐는데, 특정 사이트에서 `404`가 났다. 구글이 인덱싱하지 않은 사이트들이 있었다.

그래서 링크 미리보기 API에서 **HTML을 직접 파싱해서 파비콘을 추출**하는 방식으로 바꿨다.

```typescript
function extractFavicon(html: string, origin: string): string {
  const selectors = [
    /rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ]
  for (const regex of selectors) {
    const match = html.match(regex)
    if (match) {
      const href = match[1]
      return href.startsWith('http') ? href : `${origin}${href}`
    }
  }
  return `${origin}/favicon.ico`
}
```

`<link rel="icon">` 찾고, 없으면 `/favicon.ico`로 fallback. **이렇게 하니까 대부분 커버됐다.**

## Chrome Web Store 심사 제출까지

기능이 어느 정도 완성되고 나서 **Chrome Web Store**에 올렸다.

처음 제출하는 거라 모르는 게 많았다. **개발자 등록비 $5**, 권한별 사용 이유 작성, 개인정보처리방침 URL 필요, 이메일 인증 등 생각보다 챙길 게 많았다. 특히 `<all_urls>` 호스트 권한은 "모든 페이지에 접근한다"는 의미라 사용 근거를 명확하게 써야 했다.

개인정보처리방침은 웹앱에 `/privacy` 페이지 만들어서 그 URL을 넣었다. 지금은 심사 중이고, **처음 제출은 3~7 영업일** 걸린다고 한다.

## 만들고 나서

기능은 단순하다. 링크 저장하고, 보고, 분류하는 것. 근데 그 단순한 걸 "어디서든 1클릭으로" 만드는 게 생각보다 챙길 게 많았다.

**익스텐션과 웹앱을 같은 Supabase 인스턴스로 연결하는 인증 구조**, 페이지마다 다른 파비콘 처리 방식, 상태별 고양이 이미지 관리 — 작은 것들이 쌓였다.

아직 Chrome Web Store 승인이 안 났지만, 개발자 모드로 직접 설치해서 쓰고 있다. 실제로 쓰다 보니까 고치고 싶은 게 계속 나온다. 그게 사이드 프로젝트의 재미인 것 같다.

---

코드는 [github.com/sevineleven/linkat](https://github.com/sevineleven/linkat)에 있다.
