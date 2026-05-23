---
title: "JWT 토큰 어디에 둘까 — 쿠키만 박았던 이유가 익숙함이었다는 깨달음 (Web · Native · WebView)"
date: 2026-05-23T03:00:00Z
category: 백엔드
tags: [백엔드, JWT, 인증, 보안]
excerpt: "웹 only 환경에선 httpOnly 쿠키가 정답이었는데, Native · WebView 까지 환경이 셋이 되니 그 답이 깨졌다. body 채널을 왜 망설였는지부터 dual contract 까지, 책임 분담을 다시 따져본 기록."
draft: false
---

한창 디프만 프로젝트 개발하다가, JWT 토큰 정책을 정해야 했다.

RN 앱이면 토큰을 어디에 두지? 로그인 화면이 웹뷰면? 바디에 내려줄까, 쿠키에 박을까, 헤더로 줄까? 각각의 의미는 뭐지?

물음표가 꼬리를 물었다. 의미를 좇는 게 개발이라고 생각해서, 답을 미루지 않고 하나씩 따져봤다.

그동안 사이드 프로젝트나 싸피 할 때는 그냥 httpOnly 쿠키에 박고 끝이었다. 별 고민 없이. 근데 이번엔 그게 안 통했다.

## 세 채널의 의미를 먼저 정리하면

토큰을 client 에게 전달하고 후속 요청에 첨부하는 방법은 크게 세 가지다.

| | Cookie (HttpOnly) | Body | Header (Bearer) |
|---|---|---|---|
| **전송 시** | `Set-Cookie` 로 내려주고 브라우저가 자동 첨부 | 응답 body 에 담아 내려줌 | `Authorization: Bearer` 로 첨부 |
| **보관 시** | 브라우저 cookie store (서버가 옵션 정함) | 클라가 어디든 저장 | 클라가 어디든 저장 |
| **책임** | 서버가 다 짊어짐 | 양쪽 (서버 발급, 클라 보관·재첨부) | 클라이언트 |
| **XSS 노출** | 차단 (JS 가 cookie 못 읽음) | 저장 위치 따라 | 저장 위치 따라 |

차이의 본질은 **책임이 어디로 옮겨가느냐**다. 이 한 줄이 글의 전부다.

## 쿠키에 박으면 책임이 다 서버에 있다

쿠키 패턴의 본질이 뭔가. 서버가 응답 헤더에 한 줄 박아 내려주면 끝이다.

```http
HTTP/1.1 200 OK
Set-Cookie: token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Content-Type: application/json

{ "user": { ... } }
```

프론트는 토큰 받았는지도 모른다. 다음 요청 보낼 때 브라우저가 알아서 쿠키 첨부한다. 만료도, 보안 옵션도, 저장 위치도 다 서버가 정한다. XSS 가 일어나도 HttpOnly 가 JS 접근을 차단하니 토큰을 못 가져간다.

이게 뭘 의미하느냐. **모든 책임이 서버에 있다**는 거다. 프론트는 인증 로직을 거의 짤 일이 없다. 백엔드가 다 해주니까. 이게 그동안 web only 환경에서 답이 됐던 진짜 이유다.

## 클라이언트가 셋이면 그 답이 깨진다

PIKI 는 사용자가 위시리스트 만들고 친구랑 토너먼트로 고르는 서비스다. 클라이언트가 셋이다.

- Web (브라우저)
- Native (React Native 앱)
- 앱 안 WebView

RN 앱은 cookie store 가 자동으로 안 붙는다. 토큰을 어딘가 따로 저장하고, 매번 헤더에 직접 박아야 한다. Keychain / SecureStorage 같은 보안 저장소가 정공법이다.

그럼 쿠키 한 채널로 끝낼 수 없다는 의미다. 새로운 채널이 필요했다.

## Body 채널을 고민했다 - 근데 망설였다

자연스러운 후보는 응답 body 였다. 발급 응답에 토큰 담아서 내려주면 클라이언트가 받아서 저장한다.

근데 망설였다. "body 에 토큰 담는 건 위험하다" 는 인식이 머릿속에 있었다.

이게 무슨 의미일까. 진짜 위험한 게 뭐지?

- 회선 위 노출? TLS 가 막는다. cookie 든 body 든 동일하다
- DevTools 에서 보임? 자기가 자기 토큰 보는 건 위협이 아니다. 보안 모델은 "다른 사람이 못 본다" 가 본질이다

진짜 위협은 **저장 위치**였다. 같은 body 도 어디에 두느냐에 따라 표면이 완전히 다르다.

```ts
// Web — XSS 한 방에 털림
localStorage.setItem('token', accessToken)

// Native — XSS 표면 자체가 없음
await Keychain.setGenericPassword('user', accessToken)
```

body 채널 자체가 위험한 게 아니라 받은 토큰을 어디에 두느냐가 표면을 만든다. 채널을 죄인 취급한 게 잘못된 framing 이었다.

그럼 왜 그렇게 망설였을까. 의미를 다시 좇아봤다.

망설인 진짜 이유는 보안 분석이 아니었다. **책임을 서버에 두고 싶었던 익숙함**이었다.

쿠키 박으면 서버가 다 짊어진다. body 로 내려주는 순간 "토큰을 어디에 둘지" 가 클라이언트 몫이 된다. 그동안 안 해본 결정이라 무의식적으로 거리감이 있었던 거다. 위험해서가 아니라 낯설어서.

## 결국 Cookie + Body Dual 로 갔다

한 채널로 통합하려고 더 고민해봤지만, 쿠키만으론 Native 가 막히고 body 만으론 Web 에서 XSS 표면이 결정적이었다. 어느 한 쪽이 다른 쪽의 제약을 해결 못 했다.

그래서 양쪽 다 두기로 했다. 서버는 한 endpoint 에서 body 와 Set-Cookie 둘 다 응답한다.

```http
HTTP/1.1 201 Created
Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=Strict
Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/auth
Content-Type: application/json

{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { ... }
}
```

클라이언트가 환경에 맞는 채널을 골라 쓴다.

- Web: cookie 채널 활용, body 의 토큰은 무시
- Native: body 채널 → Keychain 저장, Set-Cookie 는 무시
- 앱 안 WebView: native 가 Keychain → cookie store 로 직접 주입

WebView 케이스가 가장 까다로웠다. 페이지는 web 이라 cookie 가 필요한데, 토큰은 native 에 있다. BE 는 해줄 게 없고 FE 가 직접 동기화해야 한다.

```ts
import CookieManager from '@react-native-cookies/cookies'
import * as Keychain from 'react-native-keychain'

const creds = await Keychain.getGenericPassword()
await CookieManager.set('https://api.piki.app', {
  name: 'accessToken',
  value: creds.password,
  httpOnly: true,
  secure: true,
})
```

이 경계가 명확해진 게 작업하면서 얻은 가장 큰 수확이었다.

PIKI 가 다루는 건 위시리스트와 토너먼트다. 결제·금융·민감 정보 없음. 도메인 민감도가 낮아 보안 vs UX 천칭이 UX 쪽으로 기우는 게 정당했다. 만약 결제 서비스였다면 dual 의 표면 증가를 받아들이기 어려웠을 거다.

## 정리 - 의미를 좇았더니 익숙함이 답이 아니었다

쿠키 박는 건 안전한 선택이 아니라 **익숙한 선택**이었다. 쿠키가 안전하긴 하다. 다만 그게 답이 됐던 건 환경이 단순했기 때문이고, 환경이 단순할 땐 책임을 한 쪽에 몰아넣는 게 가장 깔끔했을 뿐이다.

환경이 다양해지는 순간 그 단순함은 깨진다. 통합되지 않는 제약이 나오고 책임을 분담해야 한다. 단순한 정답이 안 통하는 환경을 만나면, 책임을 어디로 옮기느냐가 곧 디자인이다.
