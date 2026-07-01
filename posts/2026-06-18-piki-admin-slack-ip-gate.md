---
title: "비밀번호 없는 admin 페이지, 슬랙으로 내 IP를 등록해 여는 PiKi 운영 백오피스"
date: 2026-06-18T10:38:55Z
category: 백엔드
tags: [백엔드, 디프만, Slack, FCM, 보안, Spring]
excerpt: "운영자가 알림 문구 하나 고치려고 매번 배포를 부탁하던 걸 없애고 싶었다. 근데 그 백오피스를 prod에 띄우자니 비밀번호로 막기도, IP로 막기도 애매했다. 결국 슬랙으로 내 IP를 등록해 여는, 비밀번호 없는 문을 만들었다."
draft: false
---

PiKi에 운영 백오피스를 하나 붙였다. 알림 문구를 배포 없이 고치고, 공지를 발송하고, 누구에게 도달했는지 결과를 보는 화면. 기능 목록만 보면 흔한 admin이다.

![하늘색 배경에 짙은 회색 장바구니 아이콘과 흰색 'Piki' 글자가 그려진 PiKi 로고](/posts/piki-admin-slack-ip-gate/piki-logo.png)

*PiKi 로고. 진짜 귀여운 것 같음*

근데 만들면서 제일 오래 붙잡은 건 기능이 아니었다. 이 화면을 prod에 띄우면서, 누가 들어올 수 있게 할 거냐는 거였다.

비밀번호로 막자니 비밀번호 관리가 또 일이다. 그 비밀번호를 어디에 둘 건지부터 걸린다. admin용 테이블을 DB에 따로 파서 해시를 저장하거나, 환경변수에 박아두고 주기적으로 rotate를 돌리거나. 어느 쪽이든 관리 포인트가 하나 더 늘고, 한 번 새면 그게 그대로 구멍이 된다.

관리도 편하고 보안 구멍도 적은데, 들이는 공수까지 적으면서 기왕이면 만드는 재미도 있는 방법은 없을까. 그 질문에서 시작했다.

IP로 막자니, 누가 언제 어디서 이 화면을 열게 될지 모른다는 게 걸렸다. AWS 보안 그룹에 IP를 박아두는 방식이면, 팀원은 정해진 자리에서만 작업하거나, 그게 아니면 매번 AWS 권한 있는 사람한테 "내 IP 좀 allow 해줘"를 부탁해야 한다.

기능이랑 상관없는, 순전히 개발 외적인 비용이다. 누군가는 이런 비용을 줄이는 게 좋은 개발이라고 하니까, 거기서 풀어보고 싶었다.

결론부터 말하면, 접근 통제를 인프라(보안 그룹)에서 슬랙으로 옮겼다. 비밀번호 대신 "슬랙 신원 + 지금 그 기기의 IP"가 열쇠가 됐다. 나머지 절반은 FCM 페이로드 이야기인데, 그건 뒤에서 풀겠다.

## 왜 백오피스를 직접 만들고 싶었나

이번 작업에는 처음부터 욕심이 하나 있었다. 개발을 안 하는 팀원에게도 실제로 도움이 되는 걸 만들어두고 싶었다.

가장 와닿은 게 알림 문구였다. `${actorName}님이 토너먼트를 시작했어요` 같은 푸시 문구. 이걸 코드에 상수로 박아두면, "님이"를 "이"로 바꾸는 것조차 코드 고치고 PR 올리고 배포해야 한다. 글자 한 끗 때문에.

사실 이 문구들도 처음 며칠은 그냥 상수로 박혀 있었는데, 애초에 어드민에서 바꿀 생각이었기 때문에 오래 두진 않았다.

그걸 기획 역할을 해주고 있는 디자이너 팀원들과 운영자가 직접 누르게 하고 싶었다.

문구를 코드에 박아 고정해두는 것 자체가 싫기도 했다. 알림 문구는 서비스 성격이나 업데이트에 따라 계속 바뀔 텍스트인데, 그때마다 상수 하나를 고치자고 배포 파이프라인을 도는 건 아깝다. 고정값이 아니라 운영 중에 유동적으로 바꾸는 값으로 두고 싶었다.

![PiKi 운영 백오피스 홈. '알림 템플릿 관리'와 '공지 발송' 두 카드가 놓여 있고, 부제로 "배포 없이 알림 문구를 수정하고 공지를 관리합니다"가 적혀 있다](/posts/piki-admin-slack-ip-gate/backoffice-home.png)

그러니까 이 백오피스의 1차 사용자는 내가 아니라 **비개발자**다. 이 전제가 뒤에 나오는 설계 결정들을 거의 다 정했다.

## 비밀번호 없는 문, 슬랙이 신원이고 IP가 자물쇠다

기존 PiKi에도 백오피스 비슷한 게 있긴 했다. 근데 그건 `@Profile("!prod")`로 prod에선 아예 숨는 개발용 보조 도구였다. DB에 더미 값을 밀어넣거나, 테스트용 토너먼트를 만들거나 하는, 개발하면서 우리끼리 쓰던 그런 거.

이번엔 정반대다. prod에서 실제 운영자가 쓰는 화면. 그래서 "누가 들어오나"가 기능만큼 중요한 과제가 됐다.

흐름은 이렇게 만들었다.

1. 슬랙에서 슬래시 커맨드를 친다 (`/admin-dev`, `/admin-prod`처럼 환경별로, 인자 없이).
2. 서버가 5분짜리 원타임 링크를 슬랙으로 돌려준다.
3. 그 링크를 들어갈 기기에서 열면, 서버가 그 기기의 IP를 자동으로 캡처해 화이트리스트에 등록하고 세션을 발급한다.
4. 그대로 `/admin`으로 들어간다.

![슬랙 봇이 보내준 원타임 접근 링크. "접속할 기기에서 이 링크를 여세요 (5분 내, 그 기기 IP가 등록됩니다)"라는 안내와 함께 grant 토큰이 붙은 URL이 적혀 있다](/posts/piki-admin-slack-ip-gate/slack-grant-link.png)

비밀번호를 외울 일도, AWS 콘솔을 열 일도 없다. 카페를 옮기면 슬랙에서 한 번 더 치면 된다. "지금 내가 앉은 자리"가 곧 등록 절차가 된다.

문제는, 이렇게 만들면 보안이 허술해 보인다는 거다. 그래서 작은 결정들을 하나씩 쌓았다.

### HMAC 서명으로 슬랙이 보낸 게 맞는지부터 본다

`/admin-access/slack`은 슬랙이 호출하는 공개 엔드포인트다. 공개돼 있으니, 누구든 이 URL로 "나 슬랙인데 IP 등록해줘" 하고 위조 요청을 보낼 수 있다.

그래서 들어온 요청이 진짜 슬랙에서 온 건지부터 검증한다. 슬랙은 `v0:{timestamp}:{body}`를 signing secret으로 HMAC-SHA256 해서 `X-Slack-Signature` 헤더에 실어 보낸다. 서버는 같은 걸 다시 계산해 맞춰본다.

```kotlin
val ts = timestamp.toLongOrNull() ?: return false
// replay 방지 — 요청 timestamp 가 현재 ±5분 이내여야 한다
if (abs(Instant.now().epochSecond - ts) > 300) return false
val expected = "v0=" + hmacSha256Hex(secret, "v0:$timestamp:$rawBody")
// 타이밍 공격 방지 — 상수 시간 비교
return MessageDigest.isEqual(expected.toByteArray(), signature.toByteArray())
```

여기서 두 개를 배웠다. 하나는 replay 방지. 서명이 맞아도 timestamp가 5분을 넘으면 거부한다. 누가 과거 요청을 그대로 다시 쏘는 걸 막는다.

다른 하나는 비교를 `MessageDigest.isEqual`로 한 거다. 평범하게 `==`로 비교하면 문자열이 어디서 처음 어긋나는지에 따라 걸리는 시간이 미세하게 달라지고, 그 시간차로 정답을 한 글자씩 맞춰갈 수 있다(타이밍 공격). 상수 시간 비교는 그걸 막는다.

솔직히 이거 직접 짜보기 전엔 "서명 검증" 한 단어로 뭉뚱그려 알고 있었다.

### getAndDelete로 원타임 링크를 진짜 한 번만

grant 링크는 한 번 쓰면 죽어야 한다. 토큰을 Redis에 짧게 넣어두고, 링크를 열 때 꺼내 쓰고 지운다.

처음엔 자연스럽게 `get` 해서 확인하고 → `delete` 하는 두 단계로 짰다. 근데 이러면 같은 링크를 두 곳에서 동시에 열었을 때, 둘 다 `get`이 성공한 다음 각자 `delete` 하는 순간이 생긴다(TOCTOU). 두 IP가 다 등록돼버린다.

그래서 Redis의 `GETDEL`(꺼내기+지우기를 한 연산으로)로 바꿨다.

```kotlin
// 조회·삭제를 원자화 — 동시 요청이 같은 토큰을 두 번 소비하는 걸 막는다
val raw = redis.opsForValue().getAndDelete(grantKey(token)) ?: return null
```

원타임이라는 단어를 진짜 원타임으로 만들려면 이 한 줄이 필요했다.

### 손 떼면 알아서 사라지는 sliding TTL

등록된 IP는 Redis에 24시간 TTL로 둔다. 그런데 그냥 24시간이면, 하루 종일 쓰다가도 24시간째 칼같이 끊긴다. 반대로 무한정 두면 어제 카페 IP가 영영 화이트리스트에 남는다.

그래서 접근할 때마다 TTL을 다시 채운다(sliding). 활동 중이면 만료되지 않고, 손을 떼면 24시간 뒤 자동으로 사라진다.

```kotlin
fun isAllowed(ip: String): Boolean = redis.hasKey(allowKey(ip))

// sliding — 접근 시 TTL 을 다시 채운다
fun refresh(ip: String) = redis.expire(allowKey(ip), adminProperties.allowlistTtl)
```

부수 효과로, 모바일이나 집 IP가 바뀌면 옛 IP는 알아서 정리된다. stale IP를 따로 청소하는 코드를 안 짜도 된다.

### 막을 땐 404, 401도 302도 아니다

게이트를 통과하려면 네 개가 다 맞아야 한다. 세션이 있고, 그 세션에 슬랙 신원이 박혀 있고, 세션이 기억하는 IP와 지금 요청 IP가 같고(쿠키만 훔쳐도 다른 자리에선 못 쓰게), 화이트리스트에 IP가 있어야 한다.

하나라도 어긋나면 어떻게 응답할까. 여기서 일부러 404를 골랐다.

```kotlin
private fun deny(response: HttpServletResponse) {
    response.status = HttpServletResponse.SC_NOT_FOUND
}
```

401(인증 필요)이나 로그인 페이지로의 302를 주면, "여기 admin이 있긴 있다"를 알려주는 셈이다. 404는 **존재 자체를 숨긴다.** 권한 없는 사람 눈엔 그냥 없는 주소다.

이 404 때문에 한참 헤맨 버그가 하나 있었다. 처음엔 `response.sendError(404)`를 썼는데, 게이트는 분명 404를 보내는데 실제 응답은 자꾸 401로 나갔다.

알고 보니 `sendError`는 서블릿 컨테이너의 `/error` 디스패치를 일으키고, `/error`는 admin 필터 체인 바깥이라 메인 JWT 체인이 그걸 가로채 401로 덮어쓰고 있었다. `sendError` 대신 `setStatus`로 상태만 박고 체인을 더 진행하지 않으니 의도한 404가 그대로 나갔다.

> 같은 "404를 보낸다"도, 어느 레이어에서 어떻게 끝내느냐에 따라 결과가 달라진다.

이런 게 직접 안 부딪혀보면 모르는 종류의 디테일이었다.

## 배포 없이 문구 고치기, DB 템플릿과 변수 카탈로그

접근 문제를 풀었으니 본론이다. 알림 문구를 코드에서 DB로 빼냈다.

![알림 템플릿 목록. TOURNAMENT_JOINED, ITEM_PARSING_COMPLETED 등 타입별로 카테고리(활동/시스템)와 현재 문구, 편집 버튼이 표 형태로 나열돼 있다](/posts/piki-admin-slack-ip-gate/template-list.png)

발송은 잦으니까 매번 DB를 치진 않는다. 메모리에 캐시해두고, 백오피스에서 문구를 고치면 캐시를 다시 읽는다. 여기서 동시성 함정을 하나 만났다.

캐시를 갱신할 때 `clear()` 하고 `putAll()` 하는 2단계로 짜면, 그 찰나에 다른 스레드가 `find()` 하면 빈 캐시를 읽는다. 문구 수정 직후 발송 트래픽에서 "템플릿 미등록"으로 실패하는 식이다. 그래서 불변 Map을 통째로 갈아끼우게 했다.

```kotlin
@Volatile
private var cache: Map<NotificationType, NotificationTemplate> = emptyMap()
```

읽는 쪽은 항상 옛 Map이나 새 Map 하나의 완전한 상태만 본다. 중간의 빈 상태가 없다.

비개발자가 쓴다는 전제는 편집 화면에서 가장 잘 드러난다. `${actorName}` 같은 변수를 손으로 타이핑하다 오타 내지 말라고, 클릭하면 삽입되는 변수 목록을 두고, 입력하는 즉시 샘플 값을 넣은 미리보기와 실제 푸시 모양까지 옆에 보여준다.

![템플릿 편집 화면. 제목에 "${actorName}님이 참가했어요"를 입력하자 오른쪽에 "홍길동님이 참가했어요"로 치환된 미리보기와 푸시 알림 모양이 실시간으로 뜬다](/posts/piki-admin-slack-ip-gate/template-edit-preview.png)

변수를 하나 더 넣으면 미리보기도 즉시 따라온다.

![같은 편집 화면에서 "${actorName}님이 ${tournamentName}에 참가했어요"로 바꾸자 미리보기가 "홍길동님이 주말 라떼 토너먼트에 참가했어요"로 갱신된 모습](/posts/piki-admin-slack-ip-gate/template-edit-tournament-var.png)

사실 이 미리보기가 내가 제일 아끼는 부분이다. 내가 짠 변수 치환 로직대로 값을 채우면 푸시가 실제로 이렇게 날아간다는 걸, 보내기 전에 눈으로 보여주는 화면.

나는 백엔드 개발자인데, 이렇게 내가 만든 결과를 UX로 띄워주는 데서 묘하게 희열을 느낀다. 쿼리 한 줄이 잠금화면 위 알림으로 바뀌는 과정을 남한테 보여줄 수 있다는 게 좋다.

이게 가능하려면 어떤 타입에 어떤 변수가 있는지가 한 곳에 정의돼 있어야 한다. 그 변수 카탈로그가 세 가지의 단일 출처다. 편집 화면의 "쓸 수 있는 변수" 표시, 선언 안 된 변수를 막는 검증, 미리보기 샘플 값.

그리고 디스패치 시점에 실제로 그 변수를 채우는 코드(`actorName`·`tournamentName`·`tournamentId`를 한 번의 조회로 채운다)와 키가 반드시 일치해야 한다. 안 그러면 미리보기는 멀쩡한데 실제 알림에선 `${tournamentName}`이 안 치환돼 그대로 나간다.

실제로 이 변수 계약을 1개에서 3개로 늘리면서 알림 6종이 깨졌고, 그 회귀를 통합 테스트로 새 계약에 고정했다.

## 공지는 발송 직전에 글자를 못 치게 했다

공지도 비슷한 철학으로 짰다. 핵심 결정 하나는 발송 순간엔 글자를 새로 못 친다는 거다.

먼저 공지를 등록(초안)해두고, 목록에서 골라서 발송한다. 발송 버튼 옆엔 입력창이 없다. 운영자가 발송하는 그 긴장된 순간에 오타를 낼 여지를 아예 없앤 거다.

![공지 화면. 위쪽에 제목·본문 등록 폼, 아래쪽에 등록된 공지 목록이 "발송됨" 상태와 대상/성공/실패 수치, 결과 보기 버튼과 함께 나열돼 있다](/posts/piki-admin-slack-ip-gate/announcement-list.png)

여기에 비개발자용 안전장치를 몇 개 더 얹었다. 발송 전에 대상자 추출 기능으로 "지금 보내면 몇 명한테 가요"를 먼저 보여주고, 즉시 발송뿐 아니라 예약 발송(시각 비우면 즉시)도 된다. 수천 명한테 한 번에 쏘면 시간이 걸리니까, 발송은 백그라운드로 돌리고 결과 화면이 진행률을 폴링해 %로 보여준다.

발송이 끝나면 집계가 남는다. 총 몇 명에게 보내 몇 건 성공했고, 실패는 FCM 응답 코드별로 몇 건인지.

![발송 결과 화면. 100% 완료, 총 대상 4 / 성공 4 / 실패 0 / 미도달 0, 그리고 "실패 사유 분포(FCM 응답 코드별)" 섹션](/posts/piki-admin-slack-ip-gate/send-result.png)

그리고 이건 실제로 기기에 꽂힌 모습이다.

![iOS 잠금화면에 뜬 PiKi 공지 푸시 알림 "공지 테스트 / 공지 테스트 body"와, 그 아래 슬랙 알림이 함께 보인다](/posts/piki-admin-slack-ip-gate/push-and-slack.png)

## FCM 페이로드를 한 곳에서 만든다

이제 나머지 절반. 사실 이 작업을 굳이 한 데는 회사 영향이 컸다.

회사에선 ORM을 Hibernate 정도로만 쓰고 쿼리는 거의 직접 짠다. 그리고 FCM 푸시도 라이브러리에 통째로 맡기기보다 페이로드를 직접 빌드하는 걸 봤다. "나도 이 기회에 이런 식으로 한번 해보자" 싶었다.

푸시를 직접 짜다 보니 진짜 문제가 보였다. PiKi는 같은 알림을 세 채널로 내보낸다.

- SSE (앱이 켜져 있을 때 실시간)
- 알림 히스토리 (목록 조회)
- FCM 푸시 (백그라운드)

세 군데서 제목·본문·이미지·딥링크용 데이터를 제각각 만들면, 어느 날 한 곳만 고치고 다른 곳은 안 고쳐서 SSE로 받은 알림과 푸시로 받은 알림이 미묘하게 달라진다. 실제로 이런 어긋남이 버그가 된다.

그래서 셰입을 만드는 곳을 하나로 못 박았다. `NotificationSsePayload.from()` 하나가 세 채널의 단일 출처다. FCM은 그 페이로드를 표시 블록(title/body)과 data(문자열 맵)로 인코딩만 한다. 카테고리나 딥링크 값을 다시 계산하지 않는다.

```kotlin
private fun buildMessage(tokens: List<String>, notification: Notification): MulticastMessage {
    val payload = NotificationSsePayload.from(notification, defaultPushImage.url)
    return MulticastMessage.builder()
        .addAllTokens(tokens)
        .setNotification(FcmNotification.builder().setTitle(payload.title).setBody(payload.body).build())
        .apply { toFcmData(payload).forEach { (k, v) -> putData(k, v) } }
        .applyPlatformConfig()
        .build()
}
```

### 알림 종류마다 페이로드 모양이 다르다 (sealed로 조립)

여기서 한 발 더 들어가면, 이 단일 페이로드는 그냥 납작한 DTO 하나가 아니다. 알림 종류에 따라 모양 자체가 다른 `sealed` 타입이다.

```kotlin
sealed interface NotificationSsePayload {
    val id: Long
    val type: NotificationType
    val title: String
    val body: String
    // ... category·imageUrl·refId 등 공통 필드

    // 라우팅 없는 알림(토너먼트 참가·시작 등). refId 하나로 딥링크가 결정된다
    data class Reference(/* 공통 */) : NotificationSsePayload
    // 위시 출처 파싱 알림. kind=WISH
    data class WishParsing(/* 공통 */) : NotificationSsePayload
    // 토너먼트 출처 파싱 알림. tournamentId·tournamentItemId까지 들고 간다
    data class TournamentParsing(/* 공통 */ val tournamentId: Long, val tournamentItemId: Long) : NotificationSsePayload
}
```

`from()`은 알림의 라우팅 컨텍스트를 보고 이 셋 중 맞는 모양을 골라 만든다. 그리고 FCM으로 보낼 때 `toFcmData`가 그 모양을 `when`으로 분기해서, 그 타입이 실제로 가진 키만 data 맵에 담는다.

```kotlin
internal fun toFcmData(payload: NotificationSsePayload): Map<String, String> =
    buildMap {
        put("id", payload.id.toString())
        put("type", payload.type.name)
        put("refId", payload.refId.toString())
        // category·imageUrl 등 공통 키 ...
        when (payload) {
            is Reference -> Unit                       // 라우팅 키 없음
            is WishParsing -> put("kind", payload.kind.name)
            is TournamentParsing -> {                  // 토너먼트 식별자까지
                put("kind", payload.kind.name)
                put("tournamentId", payload.tournamentId.toString())
                put("tournamentItemId", payload.tournamentItemId.toString())
            }
        }
    }
```

이게 내가 이 작업에서 제일 마음에 드는 부분이다. FCM의 data는 값에 null을 못 담는다. "이 알림은 토너먼트 식별자가 없으니 그 키는 빼자"를 런타임에 `if (x != null)`로 일일이 가리는 대신, 타입 자체에 모양을 박아두니 빠질 키는 처음부터 그 타입에 없다.

게다가 새 알림 종류가 생기면 `when`의 exhaustive가 깨져서 컴파일러가 "여기 처리 안 했다"고 짚어준다. 키를 빠뜨려 클라 딥링크가 조용히 깨지는 사고를, 컴파일 단계에서 막는 셈이다.

정리하면 동적 조립이 두 겹이다. 문구(title/body)는 DB 템플릿에 변수를 치환해 채우고, 데이터 모양은 sealed 페이로드를 종류별로 골라 조립한다. 그렇게 만든 한 덩어리를 SSE·히스토리·FCM이 똑같이 나눠 쓴다.

직접 빌드하니 라이브러리 뒤에 숨어 있던 결정들을 하나씩 내가 내려야 했다.

**죽은 토큰을 언제 지울 것인가.** FCM이 발송 실패를 돌려줄 때, 그게 "앱 삭제돼서 토큰이 죽었다(UNREGISTERED)"일 수도 있고 "요청 파라미터가 잘못됐다(INVALID_ARGUMENT)"일 수도 있다. 둘을 똑같이 "죽은 토큰"으로 보고 지우면, 내 코드 버그 하나로 멀쩡한 토큰을 대량 삭제할 수 있다. 그래서 `UNREGISTERED`일 때만 보수적으로 지우고, 나머지는 로그만 남기고 토큰을 보존한다.

**한 발송에 여러 플랫폼.** APNS(iOS)·Android·WebPush 설정을 한 메시지에 다 실어 보낸다. FCM이 각 토큰의 플랫폼에 맞는 설정만 적용하니까, 토큰마다 플랫폼을 구분해 따로 보낼 필요가 없다. 덕분에 `platform` 컬럼 없이도 iOS·Android·웹을 한 번에 커버한다.

**500개씩 끊어서.** FCM 멀티캐스트는 한 번에 최대 500토큰이다. 그래서 청크로 나눠 보내고, 한 청크가 통째로 실패해도(네트워크 등) 나머지 청크는 계속 시도한다. 부분 실패를 전체 실패로 키우지 않는다.

그리고 토큰은 크리덴셜이라 로그에 원문을 안 남기고 마스킹한 지문만 찍는다. 렌더된 제목·본문에는 닉네임 같은 PII가 들어갈 수 있어서, 그것도 로그에 안 싣고 라우팅 식별자만 남긴다.

라이브러리에 맡겼으면 영영 몰랐을 결정들이다.

## 아직 안 한 것들

정직하게, 구멍도 있다.

예약 발송 스케줄러는 지금 단일 인스턴스 가정이다. 서버를 여러 대로 띄우면 같은 예약 공지를 두 대가 동시에 집어 중복 발송할 수 있다. 분산 락이 필요한데 아직 안 넣었다. 지금은 인스턴스가 하나라 문제가 안 될 뿐이다.

실제 FCM이 진짜로 기기에 꽂히는지는 토큰이 있는 환경에서만 검증된다. 그래서 dev에선 내 테스트 기기 토큰을 직접 등록해 눈으로 확인했다(위 잠금화면 스샷이 그거다).

이런 한계는 PR 본문에도 그대로 적어뒀다. 인스턴스를 여러 대로 늘리거나, 쿠버네티스에 올리거나, MSA로 쪼개는 식으로 언젠가는 손봐야 할 일이라고 생각한다. 지금 구조에 안 맞아서가 아니다. 아직 그 단계가 아닌 거다.

## 결국, 접근 통제를 셀프서비스로 옮긴 일이었다

만들고 나서 보니, 이번 작업은 결국 하나로 모인다. 원래 백엔드(나)나 인프라(AWS 콘솔)를 거쳐야 하던 일을, 슬랙과 백오피스로 내려서 당사자가 직접 하게 만든 거다.

문구를 고치는 일은 디자이너에게, 공지를 보내는 일은 운영자에게, admin에 들어가는 일도 보안 그룹을 만질 줄 아는 사람을 거치지 않고 슬랙을 쓸 줄 아는 팀원이면 누구나 할 수 있게 됐다.

그런데 만들고 보니 한 가지가 계속 걸린다. 그럼 책임은 어디에 있는 걸까. 물론 누가 무엇을 바꿨는지 `<변경자> + <변경 작업>` 로그는 다 남긴다.

근데 그게 공동의 책임이 되는 건지, 아니면 오히려 흐려지는 건지는 아직 잘 모르겠다. 이게 옳은 방향인지는 하루하루 써보면서 디벨롭해볼 여지가 있다.

개발자는 사용자한테 편한 UX를 만드는 사람이라고만 생각했다. 근데 이번에 해보니, 팀에게도 그 편함을 만들어줄 줄 알아야 했다. 같이 일하는 사람의 일을 코드로 덜어주는 것. 그게 좀 멋있더라.

4분 안에 읽히는 글을 나름의 원칙으로 했는데,,, 글이 너무 길어졌다...

---

> [디프만 공식 블로그 바로가기](https://medium.com/depromeet)
