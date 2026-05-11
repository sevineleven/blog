---
title: "MCP 오케스트레이터 구축기 - 오케스트레이터 설계"
date: 2026-05-11T09:00:00Z
category: 백엔드
tags: [백엔드, Spring, MCP, Java]
excerpt: "MCP 서버가 여러 개가 되는 순간 에이전트는 어디에 요청해야 할지 모른다. 그 문제를 오케스트레이터로 풀었다."
draft: false
series: "MCP 오케스트레이터 구축기"
---

MCP 서버가 하나일 땐 직접 붙으면 된다. 서버가 여러 개가 되는 순간 문제가 생긴다.

```
PDF 변환 서버    :8081
AI 업스케일 서버 :8082
HWP 변환 서버    :8083
```

에이전트가 "이 PDF 이미지로 바꿔줘"라고 하면, 어느 서버에 요청해야 하는지 알아야 한다. 서버마다 직접 붙는 건 말이 안 된다. 오케스트레이터가 이 문제를 해결한다.

---

## 구조

```
에이전트
  │  POST /mcp  (tools/call: pdf_to_jpg)
  ▼
오케스트레이터  ←  이 툴이 어느 서버에 있는지 안다
  │  라우팅
  ▼
PDF 변환 서버  →  결과 반환
```

에이전트는 오케스트레이터 주소 하나만 안다. 나머지는 오케스트레이터가 처리한다.

책임을 네 가지로 분리했다.

| 컴포넌트 | 역할 |
|---|---|
| `McpServerRegistry` | 서버 목록 저장 (ConcurrentHashMap) |
| `ToolsListCollector` | 서버에서 툴 목록 수집 |
| `McpProxyController` | 요청 받아서 라우팅 |

---

## 서버 등록 플로우

![서버 등록 화면](/posts/mcp-orchestrator-2/servers-register.png)

등록 요청이 오면 세 단계가 순서대로 일어난다.

```
1. 레지스트리에 PENDING 상태로 저장
2. tools/list 요청으로 툴 목록 수집
3. 성공하면 ACTIVE 전환
```

```java
public McpServerRecord register(String name, String url, ...) {
    String serverId = UUID.randomUUID().toString();
    McpServerRecord record = McpServerRecord.builder()
        .serverId(serverId).name(name).url(url)
        .status(ServerStatus.PENDING)
        .build();

    registry.register(record);
    toolsListCollector.collect(serverId, url);  // tools/list
    registry.updateStatus(serverId, ServerStatus.ACTIVE);
    return registry.find(serverId).orElseThrow();
}
```

등록 즉시 ACTIVE가 되고, 서버 카드에 수집된 툴 목록이 표시된다.

---

## 툴 라우팅

핵심은 `toolName → serverId` 맵이다.

```java
private final ConcurrentHashMap<String, String> toolToServerId = new ConcurrentHashMap<>();
```

`tools/list` 수집 시 이 맵을 채운다. `tools/call`이 오면 툴 이름으로 O(1)에 서버를 찾는다.

```java
case "tools/call" -> {
    String toolName = body.path("params").path("name").asText();
    String targetServerId = registry.findByToolName(toolName).orElseThrow();
    String targetUrl = registry.find(targetServerId).map(McpServerRecord::getUrl).orElseThrow();

    String response = restClient.post()
        .uri(targetUrl + "/mcp")
        .header("X-Mcp-Token", token)  // 토큰 전파
        .body(objectMapper.writeValueAsString(body))
        .retrieve()
        .body(String.class);

    return ResponseEntity.ok(objectMapper.readTree(response));
}
```

오케스트레이터는 요청을 **그대로** 포워딩한다. 변환하거나 가공하지 않는다. 인증 토큰도 그대로 전파된다.

---

## Tools 페이지

![툴 목록 화면](/posts/mcp-orchestrator-2/tools-schema.png)

Tools 페이지에서 서버별로 그룹핑된 툴 카드를 볼 수 있다. Schema 버튼을 누르면 파라미터 정의가 펼쳐진다. "Run in Demo" 버튼을 누르면 바로 실행 페이지로 이동한다.

---

다음 편에서는 여기서 만든 오케스트레이터에 Playwright MCP를 붙여서, 내 오케스트레이터가 세상에 있는 외부 MCP를 실제로 제어할 수 있는지 검증한다.

