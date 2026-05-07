---
title: "MCP 오케스트레이터 구축기 - 왜 이걸 시작했나"
date: 2026-05-07T10:00:00Z
category: 백엔드
tags: [백엔드, Spring, MCP]
excerpt: "MCP를 클라이언트로만 쓰다가, 직접 서버를 만들어야 하는 상황이 됐다."
draft: false
series: "MCP 오케스트레이터 구축기"
---

회사에서 MCP 기반 서비스를 연동하는 작업을 맡게 됐다.

구조는 대략 이렇다. 누군가 바이브 코딩 플랫폼에서 자연어로 "이런 기능을 가진 MCP 서버 만들어줘" 하면, LLM 에이전트가 코드를 생성하고 Vercel에 자동 배포된다. 배포가 완료되면 백엔드에 등록되고, 사용자는 웹에서 등록된 MCP 서버 목록을 보고 원하는 걸 골라 쓸 수 있다. Claude, GPT 같은 외부 에이전트도 표준 MCP 프로토콜로 붙을 수 있는 구조다.

```
바이브 코딩 플랫폼 (자연어 → MCP 서버 생성)
        ↓ Vercel 배포
백엔드 (등록 / 관리 / 헬스체크)
        ↓
프론트엔드 (MCP 서버 목록 UI)
        ↓
외부 에이전트 (Claude, GPT 등)
```

내 역할은 백엔드와 데이터 저장소다. MCP 서버 등록/관리 API, 헬스체크 폴링, 프론트엔드용 목록 API, 외부 에이전트 인증까지.

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

```
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
