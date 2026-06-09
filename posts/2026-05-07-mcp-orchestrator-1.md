---
title: "MCP 오케스트레이터 구축기 - Spring AI로 MCP 서버 띄우기"
date: 2026-05-07T09:28:00Z
category: 백엔드
tags: [백엔드, Spring, MCP]
excerpt: "MCP를 클라이언트로만 쓰다가, 직접 서버를 만들어야 하는 상황이 됐다."
draft: false
series: "MCP 오케스트레이터 구축기"
---

회사에서 MCP 기반 서비스를 연동하는 작업을 맡게 됐다.

구조는 대략 이렇다. 누군가 MCP 생성 에이전트에 자연어로 "이런 기능을 가진 MCP 서버 만들어줘" 하면, LLM이 코드를 생성하고 Vercel에 자동 배포된다. 배포가 완료되면 백엔드에 등록되고, 사용자는 웹에서 등록된 MCP 서버 목록을 보고 원하는 걸 골라 쓸 수 있다. Claude, GPT 같은 외부 에이전트도 표준 MCP 프로토콜로 붙을 수 있는 구조다.

<svg viewBox="0 0 800 870" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MCP 오케스트레이터 시스템 아키텍처" style="width:100%;height:auto;max-width:800px;display:block;margin:32px auto;font-family:var(--mono),monospace">
  <defs>
    <marker id="mcp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)" />
    </marker>
    <marker id="mcp-arr-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" style="fill:var(--green)" />
    </marker>
  </defs>

  <rect x="80" y="10" width="280" height="64" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="220" y="36" text-anchor="middle" style="fill:var(--text);font-size:14px;font-weight:600">MCP 생성 에이전트</text>
  <text x="220" y="56" text-anchor="middle" style="fill:var(--muted);font-size:11px">자연어 → MCP 서버 코드 자동 생성</text>

  <line x1="362" y1="42" x2="438" y2="42" style="stroke:var(--muted);stroke-width:1.2" marker-end="url(#mcp-arr)" />
  <text x="400" y="34" text-anchor="middle" style="fill:var(--muted);font-size:10px;letter-spacing:0.05em">VERCEL 배포</text>

  <rect x="440" y="10" width="280" height="64" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="580" y="36" text-anchor="middle" style="fill:var(--text);font-size:14px;font-weight:600">배포된 MCP 서버</text>
  <text x="580" y="56" text-anchor="middle" style="fill:var(--muted);font-size:11px">Vercel 호스팅 · 각자 고유 URL</text>

  <line x1="580" y1="74" x2="580" y2="146" style="stroke:var(--muted);stroke-width:1.2" marker-end="url(#mcp-arr)" />
  <text x="595" y="116" style="fill:var(--muted);font-size:10px;letter-spacing:0.05em">등록 (MCP 규약)</text>

  <rect x="20" y="130" width="760" height="430" rx="8" style="fill:none;stroke:var(--green);stroke-width:1.5;stroke-dasharray:5 4" />
  <text x="40" y="152" style="fill:var(--green);font-size:11px;font-weight:700;letter-spacing:0.1em">★ 내 담당 (BACKEND OWNERSHIP)</text>

  <rect x="60" y="170" width="540" height="60" rx="6" style="fill:var(--surface);stroke:var(--green);stroke-width:1.5;stroke-dasharray:6 3" />
  <text x="74" y="190" style="fill:var(--green);font-size:9px;font-weight:700;letter-spacing:0.1em">[ 정의 / SPEC ]</text>
  <text x="78" y="210" style="fill:var(--text);font-size:13px;font-weight:600">MCP 통신 규약</text>
  <text x="78" y="224" style="fill:var(--muted);font-size:10px">tools / resources / prompts · JSON-RPC 2.0 — 외부 시스템 모두가 이 규약을 따름</text>

  <line x1="600" y1="200" x2="660" y2="200" style="stroke:var(--green);stroke-width:1.2;stroke-dasharray:3 2" marker-end="url(#mcp-arr-g)" />
  <text x="664" y="196" style="fill:var(--green);font-size:9px;font-weight:600">외부에</text>
  <text x="664" y="208" style="fill:var(--green);font-size:9px;font-weight:600">제공</text>

  <rect x="60" y="248" width="680" height="120" rx="6" style="fill:var(--surface);stroke:var(--green);stroke-width:1.5" />
  <text x="78" y="272" style="fill:var(--text);font-size:14px;font-weight:600">백엔드 (Spring Boot 4.x · Spring AI 2.0)</text>
  <text x="78" y="294" style="fill:var(--muted);font-size:11px">- 등록 / 관리 API · 헬스체크 폴링 · 프론트용 목록 API</text>
  <text x="78" y="312" style="fill:var(--muted);font-size:11px">- 외부 에이전트 인증 (PAT 검증)</text>
  <text x="78" y="330" style="fill:var(--muted);font-size:11px">- 사용량 트래킹 (Credit 차감)</text>
  <text x="78" y="348" style="fill:var(--muted);font-size:11px">- 사내 시스템 연계 (Credit / PAT / Engine)</text>

  <line x1="400" y1="368" x2="400" y2="385" style="stroke:var(--muted);stroke-width:1.2" />
  <line x1="170" y1="385" x2="630" y2="385" style="stroke:var(--muted);stroke-width:1.2" />
  <line x1="170" y1="385" x2="170" y2="408" style="stroke:var(--muted);stroke-width:1.2" marker-end="url(#mcp-arr)" />
  <line x1="400" y1="385" x2="400" y2="408" style="stroke:var(--muted);stroke-width:1.2" marker-end="url(#mcp-arr)" />
  <line x1="630" y1="385" x2="630" y2="408" style="stroke:var(--muted);stroke-width:1.2" marker-end="url(#mcp-arr)" />

  <rect x="60" y="412" width="220" height="100" rx="6" style="fill:var(--surface);stroke:var(--green);stroke-width:1.5" />
  <text x="170" y="438" text-anchor="middle" style="fill:var(--text);font-size:13px;font-weight:600">Engine 어댑터</text>
  <text x="170" y="460" text-anchor="middle" style="fill:var(--muted);font-size:10px">MCP → 사내 규약 wrapping</text>
  <text x="170" y="478" text-anchor="middle" style="fill:var(--muted);font-size:10px">내부 Engine으로 전달</text>

  <rect x="290" y="412" width="220" height="100" rx="6" style="fill:var(--surface);stroke:var(--green);stroke-width:1.5" />
  <text x="400" y="438" text-anchor="middle" style="fill:var(--text);font-size:13px;font-weight:600">데이터 저장소</text>
  <text x="400" y="460" text-anchor="middle" style="fill:var(--muted);font-size:10px">메타데이터 · 헬스 상태</text>
  <text x="400" y="478" text-anchor="middle" style="fill:var(--muted);font-size:10px">토큰 / Credit 캐시</text>

  <rect x="520" y="412" width="220" height="100" rx="6" style="fill:var(--surface);stroke:var(--green);stroke-width:1.5" />
  <text x="630" y="438" text-anchor="middle" style="fill:var(--text);font-size:13px;font-weight:600">사내 시스템 연계 어댑터</text>
  <text x="630" y="460" text-anchor="middle" style="fill:var(--muted);font-size:10px">Credit 차감 / PAT 검증</text>
  <text x="630" y="478" text-anchor="middle" style="fill:var(--muted);font-size:10px">UserId 기반 매핑</text>

  <line x1="170" y1="512" x2="170" y2="606" style="stroke:var(--muted);stroke-width:1.5" marker-end="url(#mcp-arr)" />

  <line x1="630" y1="512" x2="630" y2="540" style="stroke:var(--muted);stroke-width:1.5" />
  <line x1="555" y1="540" x2="700" y2="540" style="stroke:var(--muted);stroke-width:1.5" />
  <line x1="555" y1="540" x2="555" y2="606" style="stroke:var(--muted);stroke-width:1.5" marker-end="url(#mcp-arr)" />
  <line x1="700" y1="540" x2="700" y2="606" style="stroke:var(--muted);stroke-width:1.5" marker-end="url(#mcp-arr)" />

  <rect x="60" y="610" width="220" height="74" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="170" y="636" text-anchor="middle" style="fill:var(--text);font-size:13px;font-weight:600">내부 Engine 시스템</text>
  <text x="170" y="656" text-anchor="middle" style="fill:var(--muted);font-size:10px">사내 LLM 실행 엔진</text>
  <text x="170" y="672" text-anchor="middle" style="fill:var(--muted);font-size:10px">사내 규약으로 통신</text>

  <rect x="500" y="610" width="110" height="74" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="555" y="636" text-anchor="middle" style="fill:var(--text);font-size:12px;font-weight:600">Credit</text>
  <text x="555" y="656" text-anchor="middle" style="fill:var(--muted);font-size:10px">사용량</text>
  <text x="555" y="670" text-anchor="middle" style="fill:var(--muted);font-size:10px">차감</text>

  <rect x="640" y="610" width="120" height="74" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="700" y="636" text-anchor="middle" style="fill:var(--text);font-size:12px;font-weight:600">PAT 인증</text>
  <text x="700" y="656" text-anchor="middle" style="fill:var(--muted);font-size:10px">UserId 기반</text>
  <text x="700" y="670" text-anchor="middle" style="fill:var(--muted);font-size:10px">토큰 검증</text>

  <rect x="80" y="750" width="280" height="80" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="220" y="778" text-anchor="middle" style="fill:var(--text);font-size:14px;font-weight:600">프론트엔드</text>
  <text x="220" y="798" text-anchor="middle" style="fill:var(--muted);font-size:11px">MCP 서버 목록 UI</text>
  <text x="220" y="816" text-anchor="middle" style="fill:var(--muted);font-size:11px">사용자가 검색 / 선택</text>

  <rect x="440" y="750" width="280" height="80" rx="6" style="fill:var(--surface);stroke:var(--border);stroke-width:1" />
  <text x="580" y="778" text-anchor="middle" style="fill:var(--text);font-size:14px;font-weight:600">외부 에이전트</text>
  <text x="580" y="798" text-anchor="middle" style="fill:var(--muted);font-size:11px">Claude, GPT 등</text>
  <text x="580" y="816" text-anchor="middle" style="fill:var(--muted);font-size:11px">PAT + 표준 MCP 프로토콜</text>

  <polyline points="60,330 25,330 25,790 80,790" style="fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3" marker-end="url(#mcp-arr)" />
  <text x="38" y="322" style="fill:var(--muted);font-size:9px;letter-spacing:0.05em">목록 API</text>

  <polyline points="740,330 775,330 775,790 720,790" style="fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3" marker-end="url(#mcp-arr)" />
  <text x="730" y="322" style="fill:var(--muted);font-size:9px;letter-spacing:0.05em">PAT + MCP</text>
</svg>

내 역할은 위 다이어그램의 초록색 영역 전체다. 좀 풀어쓰면:

- **MCP 통신 규약 정의** — 우리 시스템에 들어오는 MCP 서버들이 어떤 형식으로 등록되고 어떤 식으로 호출되는지의 spec. 이걸 내가 정의해야 외부 시스템(MCP 생성 에이전트, 배포된 MCP 서버, 외부 에이전트)이 그걸 따라서 동작한다.
- **백엔드** — 등록/관리 API, 헬스체크, 프론트용 목록 API, 외부 에이전트의 PAT 검증, Credit 차감.
- **Engine 어댑터** — MCP 형식으로 들어온 도구 호출을 사내 Engine 시스템이 이해할 수 있는 사내 규약으로 wrapping해서 전달.
- **사내 시스템 연계** — UserId 기반 PAT로 외부 에이전트 인증, Credit 시스템과 사용량 차감 연동.

MCP 자체는 써봤다. 커서나 Claude에 외부 MCP 서버를 연결해서 쓰는 정도. 그런데 직접 서버를 구현해본 적은 없었다. 통신 규약도 내가 직접 정의해야 하는 상황이라, 클라이언트로 쓰는 것과 서버를 만드는 건 다른 얘기라는 걸 실감했다. 그래서 일단 직접 만들어보기로 했다.


---

## MCP가 뭔데?

MCP(Model Context Protocol)는 Anthropic이 만든 오픈 표준 프로토콜이다. LLM이 외부 도구(Tool)를 호출할 수 있게 해주는 규약이라고 보면 된다.

핵심은 세 가지 프리미티브다:

- **Tools** — LLM이 호출할 수 있는 함수
- **Resources** — 서버가 노출하는 데이터
- **Prompts** — 서버가 제공하는 프롬프트 템플릿

통신은 JSON-RPC 2.0 기반이고, 흐름은 이렇다:

1. `initialize` — 핸드셰이크
2. `tools/list` — 어떤 도구 있는지 조회
3. `tools/call` — 도구 실행

---

## 사전 POC — demoagent

MCP 전에 비슷한 구조를 직접 구현해본 적이 있다.

LLM이 JSON으로 도구 호출 지시를 반환하면, 서버가 파싱해서 별도 HTTP 서버를 호출하는 방식이었다. 시스템 프롬프트에 URL과 인자 스펙을 적어두면 LLM이 알아서 골라 쓰는 구조.

```
LLM → {"action": "call", "url": "...", "args": {...}} → HTTP Tool 서버
```

MCP는 이 구조를 표준화한 것이다. 직접 만들었던 게 MCP랑 개념적으로 거의 같다는 걸 나중에 알았다.

---

## Spring AI로 MCP 서버 만들기

### 의존성

```groovy
repositories {
    mavenCentral()
    maven { url 'https://repo.spring.io/milestone' }
}

dependencyManagement {
    imports {
        mavenBom 'org.springframework.ai:spring-ai-bom:2.0.0-M3'
    }
}

dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-mcp-server-webmvc'
}
```

Spring Boot 4.x 기준이라 milestone 저장소 추가가 필요하다.

> **삽질 포인트**: 사내 대부분 프로젝트가 아직 JAVA 8 LTS로 이루어져있는데, `JAVA_HOME`이 JDK 8로 잡혀있으면 Gradle 실행 자체가 안 된다. Gradle은 JDK 17+ 필요.
> ```bash
> export JAVA_HOME="/c/Users/{user}/.jdks/liberica-21.0.6"
> ```

### 도구 구현

`@Tool` 어노테이션 하나면 끝이다.

```java
@Component
public class RandomTool {

    @Tool(description = "minVal 이상 maxVal 이하의 정수 난수를 반환한다")
    public int random(
            @ToolParam(description = "최솟값 (포함)") int minVal,
            @ToolParam(description = "최댓값 (포함)") int maxVal
    ) {
        return RandomGenerator.getDefault().nextInt(minVal, maxVal + 1);
    }
}
```

### ToolCallbackProvider 등록

Spring AI가 `@Tool` 메서드를 MCP 도구로 인식하려면 빈 등록이 필요하다.

```java
@Bean
public ToolCallbackProvider randomTools(RandomTool randomTool) {
    return MethodToolCallbackProvider.builder().toolObjects(randomTool).build();
}
```

### 설정

```properties
spring.ai.mcp.server.name=mcporchestrator
spring.ai.mcp.server.version=0.0.1
spring.ai.mcp.server.protocol=STREAMABLE
spring.ai.mcp.server.port=8080
```

### MCP Inspector로 검증

```bash
npx @modelcontextprotocol/inspector
```

Transport: Streamable HTTP, URL: `http://localhost:8080/mcp`

Tools 탭에서 `random` 도구 목록 조회 성공.

---

## LLM 붙이기

MCP 서버만 있으면 반쪽짜리다. GPT-4o-mini를 붙여서 자연어로 도구를 호출하게 해봤다.

```groovy
implementation 'org.springframework.ai:spring-ai-starter-model-openai'
```

```java
@Service
public class AgentService {

    private final ChatClient chatClient;

    public AgentService(ChatClient.Builder builder,
                        @Qualifier("randomTools") ToolCallbackProvider tools) {
        this.chatClient = builder
                .defaultToolCallbacks(tools)
                .build();
    }

    public String chat(String question) {
        return chatClient.prompt()
                .user(question)
                .call()
                .content();
    }
}
```

```bash
curl -X POST http://localhost:8080/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "pick a random number between 1 and 100"}'

{"answer": "The random number between 1 and 100 is 87."}
```

로그로 확인한 흐름:

```log
[Agent] 질문 수신: pick a random number between 1 and 100
DefaultToolCallingManager: Executing tool call: random
[Tool:random] LLM이 도구 호출 → minVal=1, maxVal=100
[Tool:random] 도구 실행 결과 → 87
[Agent] 최종 응답: The random number between 1 and 100 is 87.
```

LLM이 스스로 `random` 도구가 필요하다고 판단하고, 인자까지 구성해서 실행했다.

---

## 근데 이게 MCP야?

아직 이 단계에서 MCP 프로토콜은 개입하지 않는다.

`DefaultToolCallingManager`가 인-프로세스로 도구를 직접 호출하는 방식이다. MCP 서버는 Inspector 연결용으로만 떠있는 상태.

진짜 MCP 프로토콜이 개입하려면 서버와 클라이언트를 분리해야 한다.

```
지금: LLM → Spring AI → 직접 메서드 호출
목표: LLM → MCP Client → HTTP → MCP Server → 메서드 호출
```

이게 다음 단계다.

---

## 정리

| 항목 | 내용 |
|---|---|
| 스택 | Spring Boot 4.x, Spring AI 2.0.0-M3, GPT-4o-mini |
| 핵심 어노테이션 | `@Tool`, `@ToolParam` |
| 검증 도구 | MCP Inspector |
| 이번 단계에서 검증한 것 | LLM이 tool 호출 여부를 스스로 판단하고 실행할 수 있다 |
| 다음 단계 | 서버/클라이언트 분리 → 진짜 MCP 프로토콜 경유 |
