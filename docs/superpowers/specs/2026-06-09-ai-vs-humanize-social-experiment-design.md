# AI 글 판별 사회실험 포스트 — 설계 문서

- 작성일: 2026-06-09
- 상태: 승인됨 (구조/공개방식/메타/주제/도구 확정)

## 목적

블로그 독자에게 같은 주제의 글 두 버전을 보여주고, **어느 쪽이 raw AI가 쓴 글인지** 맞히게 하는 사회실험 포스트를 만든다. 정답은 드래그하면 드러나는 스포일러로 공개한다.

핵심 구도:
- **버전 A** — Claude(AI)가 블로그 voice 강제 없이 자연스럽게 쓴 raw 초안
- **버전 B** — 버전 A를 `im-not-ai`(humanize-korean) 기술로 윤문한 것 → `B = humanize(A)`

즉 엄밀히는 "사람 vs AI"가 아니라 **"raw AI" vs "humanize 처리한 AI"**를 구분하는 실험이다. 이 사실은 도입부에서 정직하게 밝힌다.

## 주제

**"왜 주니어일수록 로그를 더 많이 찍어야 하는가"**

의견+기술 혼합 주제라 raw AI 특유의 패턴("결론적으로", 번호 나열, "~를 통해", 과도한 헤지)이 자연스럽게 등장하고, humanize 처리 효과가 잘 드러난다. 블로그의 주니어 devlog 톤과도 맞는다.

## 글 구조 (포스트 1개, self-contained)

```
[도입] 사회실험 선언 — 둘 중 하나는 raw AI, 하나는 humanize 처리한 AI. 맞혀봐.
[버전 A] 주제 글 (raw AI 초안)
[버전 B] 같은 주제·같은 내용 (A를 humanize 처리)
[맞히기] "A일까 B일까?" + AI 티가 나는 판단 포인트 힌트
[정답] 드래그하면 보이는 스포일러 + 어떤 패턴이 차이를 만들었는지 해설
[메타] im-not-ai가 무엇을 바꿨는지, 실험의 의미
```

두 버전은 **내용·길이 동일**, 표현만 다르게. 각 버전 600~1,000자 (humanize fast mode 한도 5,000자 이내).

## 정답 공개 — 드래그 스포일러 (CSS만, JS 없음)

블로그 마크다운 파이프라인이 `allowDangerousHtml: true` + `rehypeRaw`라 raw HTML/CSS가 그대로 렌더링된다. 별도 컴포넌트 불필요.

```html
<span style="background:var(--text);color:var(--text);border-radius:3px;padding:0 4px;">
  정답: 버전 X가 raw AI입니다
</span>
```

배경색 = 글자색이라 평소엔 안 보이고, 드래그(텍스트 선택) 시 `::selection` 대비로 드러난다. 모바일은 길게 눌러 선택하면 보임.

## 도구: im-not-ai (humanize-korean) 설치 및 실행

- 레포: https://github.com/epoko77-ai/im-not-ai
- 설치: 클론 후 `./install.sh --claude-only --copy` → `~/.claude/skills/{humanize-korean,humanize,humanize-redo}` + `~/.claude/agents/*.md`
  - Windows 심링크 권한 이슈 회피 위해 `--copy` 사용
- 실행 주의: 스킬은 세션 시작 시 스캔되므로 이번 세션에선 Skill 도구로 호출 불가. 설치된 SKILL.md + 에이전트 프롬프트를 읽어 동일 절차를 직접 수행해 B버전 생성. 다음 세션부턴 `/humanize-korean` 사용 가능.

## 검증 기준

- 두 버전 내용 동등성 (사실/논지 동일, 표현만 차이)
- 드래그 스포일러가 평소엔 안 보이고 선택 시 드러남 (라이트/다크 테마 모두)
- 도입부에서 실험임을 명시
- frontmatter/SEO는 블로그 push 규칙 준수 (발행은 별도, 사용자 트리거)

## 비고

이 실험은 사용자와 함께 계획·진행한 것으로, 기록을 남겨도 좋다는 사용자 동의가 있었다.
