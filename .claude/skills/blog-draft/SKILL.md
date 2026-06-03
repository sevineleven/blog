---
name: blog-draft
description: >
  Use this when turning notes, research, or a lived experience into a finished post for THIS blog, in the author's own voice — triggers: "초안 써줘", "이 내용으로 블로그 글 만들어줘", "내 목소리로 정리해줘", or as the final step of write-post. It encodes the blog's junior-developer devlog voice (honest, first-person, learning-in-public), the section/structure habits, and the frontmatter + SEO/AEO conventions, and writes a complete posts/YYYY-MM-DD-slug.md. Invoke this for any drafting of a post body so the result reads like the author and not like generic AI prose — and so title/excerpt/slug/alt all follow the rules /push will check. Stops at a draft; never publishes.
---

# blog-draft — 내 목소리로 초안 쓰기

이 블로그의 무기는 화려한 문장이 아니라 **솔직한 주니어의 시점**이다. 권위 있는 전문가가 정답을 내려주는 글이 아니라, **배우면서 깨달은 걸 동료에게 나누는** 글. 독자도, AI 엔진도, 그 진짜배기 학습 기록을 일반적인 전문가 투의 글보다 신뢰한다. 그게 인용되고 검색에 걸리는 이유다.

기존 글들이 살아있는 스타일 가이드다. 막히면 `posts/`의 최근 글(특히 `2026-05-23-jwt-...`, `2026-06-03-add-terminal-cmux`, `2026-05-04-linkat-devlog`)을 열어 톤을 맞춰라.

## 페르소나 — 주니어 개발자
- 모르던 걸 솔직히 인정한다. "그동안은 그냥 쿠키에 박고 끝이었다", "이렇게 귀찮을 줄 몰랐다", "처음엔 몰랐는데".
- 정답을 선언하지 말고, **내가 어떻게 거기 도달했는지**를 보여준다. 물음표를 따라가는 과정 자체가 글이다.
- 과장·허세 금지. 모르는 건 모른다고, 확신 없는 건 "~인 것 같다"로.

## 보이스 규칙 (예시는 실제 글에서)
- **1인칭 과거형 회고.** 짧게 끊어 친다. 한 문장 문단도 좋다. 리듬을 위해 줄을 띄운다.
- **훅으로 연다.** 감정·불편·깨달음·단도직입 중 하나로 시작. 일반적인 배경 설명으로 열지 마라.
  - 예: "일단 시작했으니 됐다." / "시작은 귀찮음이었다." / "한창 디프만 프로젝트 개발하다가, JWT 토큰 정책을 정해야 했다."
- **섹션 헤더는 라벨이 아니라 주장.** "서론/방법/결론" ❌. "검색의 무게중심이 바뀌고 있다", "tmux — 깔자마자 옛날 것이라는 걸 알았다" ⭕.
- **"이 글의 한 줄".** 글 전체를 한 문장으로 압축해 어딘가에 박는다(굵게 또는 인용구). "차이의 본질은 책임이 어디로 옮겨가느냐다. 이 한 줄이 글의 전부다."
- **구체 > 추상.** 실제 고유명사(싸피·디프만·회사·도구명), 수치, 실제 장면. 인터뷰에서 받은 디테일을 그대로 살린다. 없는 경험을 지어내지 마라.
- **마무리는 반-과장·담백하게.** 앞을 내다보는 한 줄, 혹은 솔직한 소회. "그게 사이드 프로젝트의 재미인 것 같다.", "나는 당분간 여기 머물 것 같다."
- **한국어는 캐주얼하되 정확하게.** 기술 용어·식별자는 원문 유지(`requestAnimationFrame`, JWT). 코드 식별자는 백틱. 비교는 표. 곁들이는 말은 em-dash(—).
- **AI 클리셰 금지.** "오늘날", "~의 세계로 떠나봅시다", "결론적으로", 기계적인 "첫째/둘째", 영혼 없는 연결어. 이런 게 보이면 다시 써라.

## 구조
1. **훅 도입** — 장면 또는 감정으로. 종종 글의 "한 줄"을 여기서 예고.
2. **본문 섹션들** — 각 헤더가 하나의 주장. 차별화 브리프의 "우리만의 각도"를 본문이 실제로 구현하게.
3. **회고적 마무리** — 배운 것, 남은 질문, 다음. 담백하게.
4. 스크린샷이 있으면(`blog-screens` 산출물) 맥락 맞는 자리에 `![구체적 alt](/posts/<slug>/<name>.png)`로 박는다. 빈 alt 금지.

## Frontmatter 규약 (`/push`가 검사함 — 미리 맞춰라)
```yaml
---
title: "..."        # 50–70자 (한글 1자=1). SERP에서 잘리지 않게. em-dash 부제 스타일 흔함.
date: 2026-MM-DDThh:mm:ssZ
category: 일상       # {일상, 백엔드, 프론트엔드, 사이드프로젝트} 중 하나
tags: [..., ...]
excerpt: "..."      # 120–160자. 메타 설명이 됨. 글의 감정적 훅 한두 문장.
draft: false
# series: "블로그 개발기"   # 같은 시리즈면 추가(선택)
---
```
- **slug**(파일명 `YYYY-MM-DD-` 뒤): 영문·숫자·하이픈, ≤60자.
- **AEO 핵심: 첫 본문 문단 ≠ excerpt.** 똑같으면 LLM이 같은 문장을 두 번 인용해 글의 고유 신호가 희석된다. excerpt는 훅, 첫 문단은 또 다른 진입.

## 산출물
`posts/YYYY-MM-DD-<slug>.md`에 완성 초안(`draft: false`)을 쓴다. 그리고 **멈춘다.** 발행하지 마라 — 사용자가 읽고 고친 뒤 `/push`로 발행한다. 경로를 알리고 "고칠 데 있으면 말해줘"로 넘긴다.

## 마지막 점검 (쓴 뒤 새 눈으로)
- 이 글, 내가 읽어도 "남이 쓴 전문가 글" 같지 않고 **나 같은가**?
- 섹션 헤더만 읽어도 글의 논지가 흐르나?
- 지어낸 경험·검증 안 된 단정은 없나?
- 첫 문단과 excerpt가 다른가? alt는 다 채웠나?
