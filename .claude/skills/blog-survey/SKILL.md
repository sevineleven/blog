---
name: blog-survey
description: >
  Use this when preparing a blog post and you need to see how OTHERS have already covered the same topic — to avoid writing a duplicate and to find the angle that makes our post worth reading. Triggers: "같은 주제 블로그 찾아줘", "남들은 이거 어떻게 썼어", "이 주제 차별화 포인트 찾아줘", competitive content analysis, or automatically as step 3 of write-post. It web-searches existing posts/articles on the topic, reads the top results, and produces a 차별화 브리프 (baseline / gaps / our unique angle). Invoke this before drafting any research-driven or trend topic, even if the user didn't ask for "competitor research" by name — being the 100th identical post earns no search or AI-citation traffic.
---

# blog-survey — 차별화 브리프 만들기

이 블로그의 가치는 **검색·AI 엔진이 우리 글을 "답"으로 고르는 것**이다. 같은 주제를 똑같이 쓰면 이미 상위에 있는 글에 밀린다. 인용도 안 된다. 그래서 글을 쓰기 전에 **남들이 이미 뭘 어떻게 썼는지** 보고, 우리가 메울 빈틈을 찾는다.

`deep-research`가 *사실*을 모은다면, 이 스킬은 *경쟁 구도와 각도*를 모은다. 둘은 다른 일이다.

## 단계

### 1. 여러 각도로 검색
한 가지 쿼리로는 한 면만 본다. 주제를 여러 각도로 검색하라:
- 기본형: `<주제>`, `<주제> 정리`, `<주제> 튜토리얼`
- 비교형: `<주제> vs <대안>`, `<주제> 차이`
- 함정형: `<주제> 주의점`, `<주제> 삽질`, `<topic> pitfalls`, `<topic> gotchas`
- 한국어 + 영어 둘 다. 한국어 블로그(velog, tistory, 개인 블로그)와 영어 글(dev.to, Medium, 공식 문서)은 결이 다르다.

### 2. 상위 5~8개 읽기
실제로 fetch해서 읽어라. 각 글에서:
- **각도**: 무슨 관점으로 썼나 (입문 설명 / 비교 / 트러블슈팅 / 후기)
- **깊이·대상**: 얕은 복붙인가, 깊은 분석인가. 누구를 위한 글인가.
- **강점**: 이 글이 잘한 것
- **빈틈**: 빠졌거나, 낡았거나(버전), 틀렸거나, 추상적이기만 한 부분

### 3. 차별화 브리프 작성
아래 형식으로 `/tmp/blog-pipeline/<slug>/survey.md`에 저장하고, 핵심을 요약해 돌려준다.

```markdown
# 차별화 브리프: <주제>

## 베이스라인 — 다들 다루는 것
- (거의 모든 글이 공통으로 말하는 것들. 우리도 빠뜨리면 안 되지만, 여기서 승부 보면 안 됨)

## 갭 — 빠졌거나 약한 것
- (낡은 버전 / 빠진 엣지케이스 / 추상적이라 와닿지 않음 / 한국어 자료 부재 / 실제 화면·수치 없음)

## 우리만의 각도
- (위 갭 중, **주니어 시점 + 사용자 실경험·실제 화면**으로 메울 수 있는 지점.
   "남들은 X만 말하는데, 나는 직접 해보니 Y였다" 같은 구체적 한 줄로 제안)

## 출처
- [제목](url) — 한 줄 평
```

## 원칙
- 베끼지 마라. 남의 글은 *지형 파악*이지 *재료*가 아니다(사실 재료는 리서치 단계 몫).
- 갭을 정직하게 봐라. 남들이 이미 완벽히 다룬 주제면, "이건 굳이 또 쓸 필요 없을지도"라고 사용자에게 말해주는 것도 가치다.
- 우리만의 각도는 항상 **이 블로그가 가진 무기** — 주니어의 솔직한 시점, 사용자의 실제 경험, 실제 화면 캡처 — 에서 나온다.
