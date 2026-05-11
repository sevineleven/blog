---
title: "MCP 오케스트레이터 구축기 - 외부 MCP 서버 붙이기"
date: 2026-05-11T10:00:00Z
category: 백엔드
tags: [백엔드, Spring, MCP, Java]
excerpt: "직접 만든 오케스트레이터에 Playwright MCP를 붙여서 실제 브라우저를 제어했다. 코드 한 줄 안 바꾸고."
draft: false
series: "MCP 오케스트레이터 구축기"
---

오케스트레이터를 만들고 나서 한 가지를 검증하고 싶었다.

> 내가 만든 오케스트레이터가 세상에 이미 있는 외부 MCP 서버도 제어할 수 있는가?

검증 대상으로 **Playwright MCP**를 골랐다.

---

## Playwright MCP란

Playwright MCP는 Microsoft가 만든 공식 MCP 서버다. 브라우저 자동화 라이브러리인 Playwright를 MCP 툴로 노출한다.

```
browser_navigate    URL 이동
browser_click       요소 클릭
browser_type        텍스트 입력
browser_take_screenshot  화면 캡처
browser_snapshot    접근성 트리 스냅샷
...
```

원래 이렇게 쓴다. Claude Desktop이나 커서에 등록하면 LLM이 브라우저를 직접 조작할 수 있다.

```
사용자: "네이버에서 오늘 날씨 찾아줘"
LLM → browser_navigate("https://naver.com")
LLM → browser_type(검색창, "오늘 날씨")
LLM → browser_screenshot()
LLM → 화면 보고 답변
```

LLM이 눈과 손을 갖는 셈이다. 이 MCP를 내 오케스트레이터에 붙여봤다.

---

## MCP 서버는 자신을 누가 호출하는지 모른다

이게 핵심이다.

```
Claude Desktop  ─┐
커서            ─┤─→  POST /mcp  →  MCP 서버
내 오케스트레이터 ─┘
```

MCP 서버 입장에서는 전부 그냥 `POST /mcp` 요청이다. 중간에 오케스트레이터가 있는지, 직접 붙는 건지 모른다. MCP가 표준 인터페이스인 덕분에, 오케스트레이터는 어떤 MCP 서버든 코드 변경 없이 붙일 수 있다.

---

## 문제: stdio vs HTTP

세상의 MCP 서버 대부분은 **stdio 방식**이다. Claude Desktop이 로컬에서 `npx`로 서버를 직접 띄워서 쓰는 구조를 상정했기 때문이다.

```bash
npx @playwright/mcp    # stdin/stdout으로 통신
```

내 오케스트레이터는 네트워크 너머의 서버들을 관리해야 한다. stdio는 이 구조 자체가 불가능하다. **HTTP가 전제 조건**이었다.

stdio MCP를 붙이려면 중간에 브릿지가 필요했다.

---

## stdio → HTTP 브릿지

Node.js 60줄짜리 브릿지를 만들었다.

```javascript
const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'inherit'], shell: true });

// HTTP 요청 → child process stdin
child.stdin.write(JSON.stringify(request) + '\n');

// child process stdout → HTTP 응답
child.stdout.on('data', data => {
    const msg = JSON.parse(data);
    pending.get(msg.id)?.resolve(msg);
});
```

어떤 stdio MCP든 HTTP로 노출시킬 수 있다.

```bash
PORT=3003 node bridge.js npx -y @playwright/mcp@latest
```

---

## Playwright MCP 등록

`http://localhost:3003`으로 오케스트레이터에 등록했다. 23개 툴이 잡혔다.

`browser_navigate`, `browser_click`, `browser_type`, `browser_take_screenshot` 등 실제 브라우저를 조작하는 툴들이다.

---

## 검증 1: 브라우저 띄우기

Agent Demo에서 `browser_navigate`를 선택하고 `https://www.google.com`을 입력했다.

![오케스트레이터에서 browser_navigate 실행 순간](/posts/mcp-orchestrator-3/playwright-orchestrator.png)

왼쪽은 내 오케스트레이터 Agent Demo, 오른쪽은 Playwright가 실제로 띄운 Chrome이다. 오케스트레이터에서 툴 하나 호출했더니 브라우저가 열렸다.

![Playwright가 찍은 Google 홈](/posts/mcp-orchestrator-3/playwright-google.png)

---

## 검증 2: 브라우저 스크린샷

`browser_take_screenshot`으로 현재 브라우저 화면을 캡처하게 시켰다.

검색창에 "roblox"를 입력한 상태에서 실행했더니, 검색 결과 화면 전체가 PNG로 저장됐다.

![Playwright가 캡처한 로블록스 구글 검색 결과](/posts/mcp-orchestrator-3/playwright-screenshot.png)

오케스트레이터가 Playwright MCP에 `tools/call`을 날렸고, Playwright는 실제 브라우저를 제어해서 스크린샷을 찍어 돌려줬다.

오케스트레이터 로그에는 이렇게 찍혔다.

```
[HealthCheck] active: playwright          ← 60초마다 살아있는지 확인
[McpProxy] tool=browser_navigate routed-to=playwright    ← 라우팅
[McpProxy] tool=browser_take_screenshot routed-to=playwright
```

`browser_navigate`와 `browser_take_screenshot` 둘 다 `playwright` 서버로 라우팅됐다는 게 로그로 확인된다. 오케스트레이터 입장에서는 그냥 툴 이름으로 서버를 찾아서 포워딩한 것뿐이다.

---

## 검증 결과

| 항목 | 내용 |
|---|---|
| 오케스트레이터 코드 변경 | 0줄 |
| 브릿지 코드 | Node.js 60줄 |
| Playwright MCP 설치 | `npx -y @playwright/mcp@latest` |
| 등록 방법 | URL 하나 입력 |
| 결과 | 실제 브라우저 제어 성공 |

내가 만든 오케스트레이터가 세상에 있는 MCP를 통제했다. 연구소가 자기 서비스를 MCP로 씌워서 URL 하나 주면, 오케스트레이터는 그냥 등록만 하면 된다. 그게 MCP를 쓰는 이유다.

---

다음 편에서는 LLM을 오케스트레이터에 붙여서 여러 MCP 서버의 툴을 자연어 하나로 조합해서 쓰는 멀티 서비스 시나리오를 다룬다. 실제 서비스와 연동하면 크레딧 차감, 사용자 인증 같은 기존 서비스의 활동이 MCP 호출과 함께 동반되어야 하기 때문에, 인증 토큰이 오케스트레이터를 거쳐 각 MCP 서버로 어떻게 전파되는지도 함께 검증한다.
