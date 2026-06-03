---
name: write-post
description: >
  Use this whenever the user wants a blog post written or drafted for THIS blog — phrased as "~한 주제로 블로그 써줘", "X에 대해 글 써줘", "포스트 하나 써줘", "블로그 글 만들어줘", "/write-post", or any request that amounts to producing a new posts/*.md entry. This is the orchestrator: it chains research → competitor survey → (optional) terminal screenshots → drafting in the blog's voice, and stops at a reviewable draft. Always invoke this instead of free-handing a post, so the chain (deep-research, blog-survey, blog-screens, blog-draft) runs and the post matches the blog's junior-dev devlog voice and SEO/AEO conventions. Do NOT publish — /push is a separate, user-triggered step.
---

# write-post — 블로그 글 집필 오케스트레이터

이 블로그는 **주니어 개발자의 1인칭 devlog**이고, 주 목표는 **외부 검색·AI 엔진 유입**이다. 그래서 글은 (1) 사용자 본인의 진짜 목소리여야 하고, (2) 남들과 똑같으면 안 되며(차별점), (3) 정확해야 한다. 이 스킬은 그 세 가지를 단계로 보장한다.

너의 역할은 **각 단계를 순서대로 엮는 것**이다. 절대 경험을 지어내지 말고, 검증 안 된 사실을 단정하지 말 것. 중간 산출물(리서치 노트·차별화 브리프)은 `/tmp/blog-pipeline/<slug>/`에 저장해 레포를 더럽히지 않는다.

## 체크리스트 (TodoWrite로 만들어 순서대로 진행)

### 0. 모드 판별 — 경험 중심 vs 리서치 중심
- **경험 중심**: 사용자가 직접 겪은 일(쓴 도구, 만든 것, 부딪힌 문제)을 풀어내는 글. 예: cmux 갈아탄 이야기, JWT 정책 고민. → 사용자의 *경험*이 본문, 리서치는 사실 뒷받침용.
- **리서치 중심**: 사용자가 잘 모르지만 정리하고 싶은 주제. 새 기술·개념 설명. → *리서치*가 본문.
- 주제만 보고 애매하면 **딱 한 번** 물어라: "이거 직접 겪은 경험 풀어내는 글이야, 아니면 조사해서 정리하는 글이야?" 둘 다 섞인 주제면 비중만 정하면 된다.

### 1. (경험 중심일 때) 사용자 인터뷰
경험 글의 품질은 **인터뷰가 좌우한다.** 지어낼 수 없으니 캐물어야 한다.
- **한 번에 하나씩** 물어라. 객관식보다 열린 질문. 여정·불편·감탄·구체적 장면·그때의 감정을 끌어내라.
- 좋은 축: "그때 제일 답답했던 게 뭐였어?", "왜 갈아탔어?", "'아 이거다' 했던 순간은?", 실제 수치·고유명사(회사·프로젝트·도구명).
- 사용자가 던지는 디테일(예: "터꾸를 했다", "IntelliJ는 env 볼 때만")은 그대로 글의 재료로 쓴다. 이게 진짜를 만든다.
- 리서치 중심이면 이 단계는 건너뛰고 2번으로.

### 2. 리서치 — 사실 수집·정제
- **깊은 주제**(API·아키텍처·비교·정확성이 중요): `deep-research` 스킬을 호출해 검증된 인용 리포트를 받는다.
- **얕은 주제**(가벼운 사실 확인): 타깃 웹검색 몇 개로 충분. 굳이 deep-research를 끌지 마라(무겁다).
- 결과는 **blog용 raw 재료로 정제**: 쓸 사실·수치·근거 링크만 추려 `/tmp/blog-pipeline/<slug>/research.md`에 저장. 리포트를 그대로 본문에 붙이지 말 것 — 재료일 뿐이다.

### 3. 차별화 — `blog-survey` 호출
같은 주제의 타 블로그·아티클을 조사해 **다들 하는 얘기(베이스라인) vs 빈틈(갭) vs 우리만의 각도** 브리프를 받는다. 우리 글이 "100번째 똑같은 글"이 되지 않게 하는 단계다. 브리프는 `/tmp/blog-pipeline/<slug>/survey.md`.

### 4. (해당하면) 스크린샷 — `blog-screens` 호출
주제가 **터미널·CLI·앱으로 시연 가능**하면 `blog-screens`로 실제 화면을 자동 캡처해 `public/posts/<slug>/`에 넣는다. 이 블로그는 "실제 화면"을 좋아한다. 시연할 게 없는 순수 개념 글이면 건너뛴다.

### 5. 초안 — `blog-draft` 호출
인터뷰 + 리서치 재료 + 차별화 브리프 + 스크린샷을 넘겨 **블로그 목소리로** 완성 초안을 쓴다. 산출물은 `posts/YYYY-MM-DD-<slug>.md` (`draft: false`, 완성본). 스크린샷이 있으면 적절한 위치에 박는다.

### 6. 리뷰 제시 — 정지
초안 경로를 알리고, 사용자가 읽고 고치게 한다. **절대 자동 발행하지 마라.** 발행은 사용자가 `/push`로 한다(SEO/AEO 검증 포함). "읽어보고 고칠 데 알려주세요, 좋으면 /push로 발행하면 됩니다"로 마친다.

## 원칙
- 단계를 건너뛰지 마라. 단, 모드에 따라 1번(인터뷰) 또는 2번(리서치) 비중이 달라질 뿐이다.
- 사용자가 "리서치 없이 그냥 내 경험으로 빨리 써줘" 같이 말하면 유연하게 단계를 줄여라. 스킬은 도구지 관료제가 아니다.
- 각 하위 스킬(`deep-research`, `blog-survey`, `blog-screens`, `blog-draft`)은 Skill 도구로 실제 호출한다.
