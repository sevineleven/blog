# cmux CLI 치트시트 (스크린샷 연출용)

cmux는 Ghostty 기반 에이전트용 터미널 앱(`com.cmuxterm.app`). 아래는 화면 연출에 쓰는, 실제로 검증된 명령들. `CMUX_QUIET=1`을 붙이면 deprecation 안내가 조용해진다.

> 주의: `--surface`/`--workspace` 참조는 **워크스페이스 맥락**이 필요하다. `cmux send --surface surface:7 ...`만 쓰면 기본값이 현재(이 세션) 워크스페이스라 `Surface is not a terminal` 오류가 난다. 항상 `--workspace workspace:N`을 함께.

## 워크스페이스 (= 세션/탭)
```bash
cmux workspace list                      # 현재 창의 워크스페이스 목록 (* = 선택됨)
cmux new-workspace --name "이름" --cwd <경로> --command "<실행할 명령>" --focus false
cmux workspace select workspace:N        # 보이는 워크스페이스 전환
cmux workspace close workspace:N         # 닫기 (현재 세션 워크스페이스는 닫지 말 것!)
cmux workspace-action --workspace workspace:N --action set-color --color Green
                                         # 색: Red Crimson Orange Amber Olive Green Teal Aqua Blue Navy Indigo Purple Magenta Rose Brown Charcoal
cmux workspace-action --workspace workspace:N --action clear-color
```
연출에 새 에이전트를 띄우려면: `--command "claude '가벼운 프롬프트'"` (대화형 claude TUI가 떠서 '일하는' 장면이 잡힘). 비용 아끼려 프롬프트는 짧게.

## 분할(surface) + 명령 전송
```bash
cmux new-split right --workspace workspace:N --focus true     # left|right|up|down
cmux list-pane-surfaces --workspace workspace:N               # surface id 확인
cmux send --workspace workspace:N --surface surface:M "claude '프롬프트'\n"
#   \n / \r = Enter, \t = Tab. 대화형 claude에 텍스트를 타이핑해 넣을 때도 이걸로.
```
한 화면에 에이전트 둘(병렬 시연): 워크스페이스 만들고 → `new-split right` → 양쪽 surface에 `send`로 각각 작업 투입 → 몇 초 후 캡처.

## Feed (모든 에이전트 상태 한눈에)
```bash
cmux feed tui          # 키보드 우선 Feed TUI. 새 워크스페이스의 --command 로 띄워 캡처:
cmux new-workspace --name "⚡ Feed" --cwd <경로> --command "cmux feed tui" --focus true
```
Feed에는 각 에이전트의 PENDING(질문/권한 요청)이 쌓인다 — "한눈에" 샷에 좋음.

## 알림 (권한 대기 배너 연출)
```bash
cmux notify --title "워크스페이스명" --subtitle "권한 필요" --body "git push origin main 실행을 허가할까요?"
```
- macOS 배너가 우상단에 뜬다. 캡처: 알림 쏜 직후 `screencapture -T 2 -x`로 전체를 잡고, PIL로 우상단 배너 영역만 크롭.
- 같은 제목으로 연달아 쏘면 macOS가 묶어서 새 배너를 안 띄울 수 있다 → 제목을 매번 다르게.
- 배너 UI 자체는 진짜 cmux 알림. 문구는 연출이므로, 블로그에 쓸 땐 "예시"임을 사용자에게 밝혀라.

## 테마 / 꾸미기
```bash
cmux themes list                         # 수백 개 (Ghostty 테마)
cmux themes set "Catppuccin Latte"       # 라이트 테마는 다크 샷과 대비가 커서 '꾸미기' 시연에 좋음
cmux reload-config                       # Ghostty + cmux.json 둘 다 리로드 (재시작 불필요)
cmux refresh-surfaces                    # 이미 그려진 패널 다시 그림
```
- 주의: 이미 출력된 패널은 테마를 바꿔도 색이 덜 바뀐다. **새 패널/새 출력**이 새 테마로 풀 렌더된다 → 테마 시연은 새 워크스페이스에서.
- 연출 끝나면 **원래 테마로 복구**: `cmux themes set "Kanagawa Dragon"` (사용자 기본값). 바꾸기 전 현재 테마를 `cmux themes list` 상단에서 확인해 두기.

## 창 프레이밍 (캡처 직전)
```bash
osascript -e 'tell application "cmux" to activate'
osascript -e 'tell application "System Events" to tell process "cmux" to set size of front window to {1920,1080}'
```
- System Events 제어는 **손쉬운 사용** 권한 필요(막히면 `1002` 오류).
- 네이티브 풀스크린 단축키(⌃⌘F)는 cmux/Ghostty에서 안 먹을 수 있으니 위 `set size`가 더 안정적.

## 세션 전환 단축키 (참고)
- 다음/이전 워크스페이스: `⌃⌘]` / `⌃⌘[`
- 번호로 점프: `⌘1` ~ `⌘9`
- 분할 패널 전환: `⌘⇧]` / `⌘⇧[`
- 새 워크스페이스: `⌘N`

## 설정 파일
- Ghostty(폰트·테마·투명도·블러): `~/.config/ghostty/config`
- cmux: `~/.config/cmux/cmux.json` (편집 전 타임스탬프 `.bak` 백업 권장)
- 스키마: `https://raw.githubusercontent.com/manaflow-ai/cmux/main/web/data/cmux.schema.json`
