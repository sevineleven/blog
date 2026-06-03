---
name: blog-screens
description: >
  Use this when a blog post would be stronger with REAL terminal/CLI/app screenshots and you can stage and capture them on this macOS machine — triggers: "스크린샷도 찍어줘", "터미널 화면 캡처해서 글에 넣어줘", "실제 화면 보여주는 글", or automatically as step 4 of write-post when the topic is demonstrable in a terminal/app (tmux, cmux, a CLI tool, a dev server). It handles the full capture flow: permission check, staging the scene, window framing, delayed screen capture, cropping with Pillow, and dropping PNGs into public/posts/<slug>/ with descriptive alt. Invoke it whenever a post demonstrates something visible on screen — this blog values authentic "실제 화면" over stock diagrams. It also restores any settings it changed and cleans up staged scenes.
---

# blog-screens — 터미널/앱 실제 화면 자동 캡처

이 블로그는 "실제 화면"을 좋아한다. 지어낸 다이어그램보다 진짜 터미널 한 장이 devlog의 신뢰를 만든다. 이 스킬은 화면을 직접 연출하고 찍어 `public/posts/<slug>/`에 넣는다.

## 0. 권한 — 먼저 확인 (안 하면 까만 화면만 찍힘)
화면 캡처는 macOS 보안 권한 2개에 묶여 있다. 코드로 못 풀고 사용자가 켜야 한다.

1. **화면 기록(Screen Recording)** — `screencapture`가 화면을 잡으려면 **이 세션을 돌리는 호스트 앱**에 필요하다. 호스트 앱 찾기: `echo $TERM_PROGRAM; echo $__CFBundleIdentifier`, 또는 부모 프로세스 추적(`ps -o comm= -p <ppid>`). 예: cmux 안이면 `com.cmuxterm.app`.
   - 테스트: `screencapture -x /tmp/_t.png && echo OK`. `could not create image from display`가 나오면 권한 없음.
   - 사용자에게: 시스템 설정 → 개인정보 보호 및 보안 → **화면 기록** → 호스트 앱 켜기 → **앱 재시작**. (재시작하면 이 세션도 끊기니, 재시작 후 `claude --continue`로 이어받게 안내. 작업 맥락은 트랜스크립트로 보존됨.)
2. **손쉬운 사용(Accessibility)** — 창 크기/포커스를 `osascript`/System Events로 제어하려면 필요. 키스트로크가 `1002` 오류로 막히면 이 권한을 켜라고 안내(보통 재시작 불필요).

## 1. 장면 연출 (Staging)
- 시연할 명령을 실제로 실행해 화면에 띄운다. 도구별 연출은 상황에 맞게.
- cmux로 병렬 에이전트/Feed/테마 등을 연출할 거면 `references/cmux-cli.md`의 치트시트를 써라(워크스페이스 생성·명령 전송·테마·Feed·알림).
- 사용자의 실제 프로젝트 워크스페이스는 건드리지 말고, **새 워크스페이스/세션을 만들어** 연출한다.

## 2. 창 프레이밍 + 캡처
포커스 가로채기가 핵심 함정이다. Bash로 명령을 돌리면 그 출력이 나는 워크스페이스로 포커스를 끌어와, 다른 화면을 찍으려 해도 자꾸 이쪽이 잡힌다. 그래서:

1. 앱을 앞으로: `osascript -e 'tell application "<App>" to activate'`
2. 창을 화면 가득: System Events로 `set size of front window to {1920,1080}` (네이티브 풀스크린보다 안정적; 단축키가 막히면 더더욱).
3. 보여줄 워크스페이스/탭 선택 (cmux: `cmux workspace select workspace:N`).
4. **지연 캡처**로 포커스가 되돌아오기 전에 찍기: `screencapture -T 3 -x /tmp/shot.png` (전체) 또는 `-R x,y,w,h`(영역).
5. **읽어서 검증** — 캡처한 PNG를 Read로 열어 까만 화면/엉뚱한 워크스페이스가 아닌지 눈으로 확인. 틀리면 다시.

## 3. 크롭 (메뉴바·독·여백 정리)
`imagemagick`/`ffmpeg`는 보통 없다. **Pillow**를 쓴다(`python3 -c "import PIL"` 실패하면 `python3 -m pip install --quiet Pillow`).
```python
from PIL import Image
im = Image.open('/tmp/shot.png')
im.crop((left, top, right, bottom)).save('/tmp/out.png')   # 좌표는 먼저 넉넉히 잘라 위치 확인 후 좁힌다
```
- 작은 배너(알림 등)는 위치를 한 번 크게 잘라 찾고(`im.crop(...)` → Read), 좌표를 좁혀 다시 자른다.
- 전체 화면 샷(메뉴바·독 포함)은 "실제 화면" 느낌이라 그대로 둬도 좋다. 판단해서 정리.

## 4. 배치
- `public/posts/<slug>/<name>.png`로 저장(`mkdir -p` 먼저).
- 마크다운 참조는 `/posts/<slug>/<name>.png`, alt는 **구체적으로**(화면에 뭐가 보이는지). 빈 alt 금지 — 이미지 검색·스크린리더·AEO가 본다.
- 파일명은 내용 기반: `parallel-agents.png`, `feed.png`, `permission-alert.png`.

## 5. 뒷정리 (반드시)
연출하며 바꾼 건 원복한다. 사용자 환경을 어지르지 마라.
- 바꾼 테마/설정 복구, 만든 워크스페이스/세션 닫기, 백업 떴으면 알리기.
- 창 크기를 최대화했으면 그대로 둬도 되지만 사용자에게 한마디.
- 무엇을 몇 장 찍었고 어디 뒀는지 보고.

## 원칙
- 연출은 비용이다(에이전트 띄우기 등). **글에서 제 몫을 하는 샷만** 찍어라. 1~3장이면 충분한 경우가 많다.
- 캡처는 항상 **읽어서 검증**하고 넘어간다. "찍었겠지"는 금물.
