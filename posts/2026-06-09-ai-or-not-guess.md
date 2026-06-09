---
title: "이 글, AI가 썼을까? — raw AI와 'AI 티 지우개'로 윤문한 글, 직접 구분하기"
date: 2026-06-09T01:27:00Z
category: 일상
tags: [AI, 글쓰기, humanize, 실험, 번역투]
excerpt: "같은 사건을 쓴 주니어 장애 회고 두 개. 하나는 AI가 그냥 뽑은 raw 버전, 다른 하나는 'AI 티'를 지워주는 도구로 윤문한 버전이다. 어느 쪽이 손 안 댄 AI인지 가려낼 수 있을까. 정답은 본문에서 드래그하면 드러난다. 한국어 AI 글의 문체 지문을 직접 확인하는 실험이다."
draft: false
---

claude code가 미리 일러둔다.

아래 실린 두 개의 글은 **둘 다 claude code(AI)가 썼다.** 사람이 쓴 문장은 한 줄도 없다. 심지어 "입사 두 달 차에 겪었다"는 그 사건조차 claude code가 지어낸 허구다.

그럼 뭘 맞히냐면 — 둘 중 하나는 claude code가 **아무 손도 안 대고 그냥 뽑은 raw 버전**이고, 다른 하나는 그 글을 [`im-not-ai`](https://github.com/epoko77-ai/im-not-ai)라는 도구로 **"AI 티"를 지운** 버전이다.

`im-not-ai`(정식 이름은 humanize-korean)는 한국어 AI 글에서 번역투·기계적 나열·"결론적으로" 같은 상투구·과한 피동·균일한 리듬을 잡아내 사람 글처럼 고쳐주는 Claude Code 스킬이다.

그래서 이 실험은 엄밀히 "사람 vs AI"가 아니다.

> **raw AI vs. AI 티를 지운 AI.**
> 같은 사건, 같은 코드, 같은 결론. 바뀐 건 문체와 리듬뿐이다.

claude code가 고른 소재는 한 주니어 백엔드 개발자의 장애 회고다 — 재시도 로직 하나 잘못 넣었다가 결제 알림을 두 번 쏜 이야기. 문제가 됐던 코드도, 트레이드오프를 대하는 태도도 그대로 들어 있다.

굳이 개발 글로 잡은 데는 이유가 있다. 그냥 평문 에세이로 분기할 수도 있었지만, claude code가 정말 확인하고 싶은 건 **개발 블로그라는 판에서 AI 티가 얼마나 드러나고, 그걸 지웠을 때 실제로 효과가 있는가**다. 그래서 일부러 코드와 트레이드오프가 섞인 개발 블로그 어투로 실험을 돌린다.

이제 두 글을 읽고, 어느 쪽이 손 안 댄 raw AI인지 가려낼 차례다.

---

## 글 A

입사하고 두 달쯤 됐을 때다. 외부 알림 API를 부르는 코드가 가끔 타임아웃이 났다. 결제 완료 알림이 이따금 안 가는 거다. 그래서 재시도를 붙이기로 했다.

처음 짠 코드는 이랬다.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentNotificationService {

    private static final int MAX_ATTEMPTS = 3;

    private final NotificationClient notificationClient;

    public void notifyPaymentCompleted(Payment payment) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                notificationClient.send(toRequest(payment));
                return;
            } catch (NotificationTimeoutException e) {
                log.warn("결제 알림 전송 타임아웃, 재시도. paymentId={}, attempt={}/{}",
                        payment.getId(), attempt, MAX_ATTEMPTS);
            }
        }
        throw new NotificationDeliveryException(payment.getId());
    }

    private NotificationRequest toRequest(Payment payment) {
        return NotificationRequest.builder()
                .userId(payment.getUserId())
                .template(NotificationTemplate.PAYMENT_COMPLETED)
                .amount(payment.getAmount())
                .build();
    }
}
```

배포하고 나니 타임아웃 때문에 알림이 누락되는 건 확실히 줄었다. 여기까지는 해결된 줄 알았다.

며칠 뒤, 고객센터에서 결제 알림이 두 번씩 온다는 문의가 들어왔다. 처음엔 영문을 몰랐는데, 로그를 뒤지다 보니 좀 어이없는 그림이 나왔다.

타임아웃이 났다고 요청이 실패한 게 아니었다. 서버는 알림을 멀쩡히 보냈는데, 응답이 돌아오는 길에 네트워크가 늦어서 클라이언트만 타임아웃으로 처리한 거다. 첫 요청은 이미 성공했는데 그걸 실패로 보고 또 보냈다. 알림이 두 번 갈 수밖에.

문제는 재시도가 아니었다. 멱등성(idempotency)이 없는 상태에서 재시도를 한 게 문제였다. 사수님이 멱등키를 두라고 했다.

요청마다 고유 키를 붙이고, 서버는 같은 키면 한 번만 처리하게 고쳤다.

```java
private NotificationRequest toRequest(Payment payment) {
    return NotificationRequest.builder()
            .userId(payment.getUserId())
            .template(NotificationTemplate.PAYMENT_COMPLETED)
            .amount(payment.getAmount())
            .idempotencyKey(idempotencyKey(payment))   // 멱등키 추가
            .build();
}

private String idempotencyKey(Payment payment) {
    return "payment-notification:" + payment.getId();
}
```

이때 배운 건 하나다. 분산 환경에서 "실패"라는 신호를 곧이곧대로 믿으면 안 된다. 타임아웃은 실패가 아니라 "결과를 모름"에 가깝다. 재시도는 분명 센 무기지만, 멱등성이 없으면 데이터를 오히려 망가뜨린다.

주니어가 트레이드오프를 가늠하는 건 어렵다. 그래도 "이 코드, 두 번 돌아도 괜찮나?" 이 질문 하나는 계속 들고 가려고 한다.

---

## 글 B

입사하고 두 달쯤 됐을 때의 일이다. 외부 알림 API를 호출하는 코드에서 간헐적으로 타임아웃이 발생하는 문제가 있었다. 사용자에게 결제 완료 알림이 가끔 누락되는 상황이었고, 이를 해결하기 위해 재시도 로직을 추가하기로 결정했다.

처음 작성한 코드는 다음과 같았다.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentNotificationService {

    private static final int MAX_ATTEMPTS = 3;

    private final NotificationClient notificationClient;

    public void notifyPaymentCompleted(Payment payment) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                notificationClient.send(toRequest(payment));
                return;
            } catch (NotificationTimeoutException e) {
                log.warn("결제 알림 전송 타임아웃, 재시도. paymentId={}, attempt={}/{}",
                        payment.getId(), attempt, MAX_ATTEMPTS);
            }
        }
        throw new NotificationDeliveryException(payment.getId());
    }

    private NotificationRequest toRequest(Payment payment) {
        return NotificationRequest.builder()
                .userId(payment.getUserId())
                .template(NotificationTemplate.PAYMENT_COMPLETED)
                .amount(payment.getAmount())
                .build();
    }
}
```

이 코드를 배포한 이후, 타임아웃으로 인한 알림 누락은 확실히 줄어들었다. 결과적으로 문제가 해결된 것처럼 보였다.

그러나 며칠 뒤, 고객센터로부터 결제 알림이 두 번씩 온다는 문의가 들어오기 시작했다. 처음에는 원인을 파악하기 어려웠지만, 로그를 분석한 결과 흥미로운 사실을 발견할 수 있었다.

타임아웃이 발생했다고 해서 요청이 실패한 것은 아니었다. 서버는 정상적으로 알림을 발송했지만, 응답이 돌아오는 과정에서 네트워크 지연으로 인해 타임아웃이 발생한 것이다. 즉, 첫 번째 요청은 성공했음에도 불구하고 클라이언트는 이를 실패로 간주하고 재시도를 수행했고, 그 결과 알림이 중복으로 발송된 것이다.

이 문제의 본질은 재시도 자체가 아니라, 멱등성(idempotency)이 보장되지 않은 상태에서 재시도를 했다는 점에 있었다. 사수님은 멱등키(idempotency key)를 도입하는 것이 좋겠다고 조언해 주셨다.

결국 요청마다 고유한 키를 부여하고, 서버 측에서 동일한 키의 요청은 한 번만 처리하도록 수정했다.

```java
private NotificationRequest toRequest(Payment payment) {
    return NotificationRequest.builder()
            .userId(payment.getUserId())
            .template(NotificationTemplate.PAYMENT_COMPLETED)
            .amount(payment.getAmount())
            .idempotencyKey(idempotencyKey(payment))   // 멱등키 추가
            .build();
}

private String idempotencyKey(Payment payment) {
    return "payment-notification:" + payment.getId();
}
```

이 경험을 통해 배운 것은, 분산 환경에서 "실패"라는 신호를 액면 그대로 믿어서는 안 된다는 점이다. 타임아웃은 실패가 아니라 "결과를 알 수 없음"에 가깝다. 재시도는 강력한 도구이지만, 멱등성이 보장되지 않으면 오히려 데이터 정합성을 해치는 양날의 검이 될 수 있다.

주니어 입장에서 트레이드오프를 고민하는 것은 쉽지 않다. 하지만 적어도 "이 코드가 두 번 실행되어도 괜찮은가?"라는 질문을 던지는 습관은, 앞으로도 큰 도움이 될 것이라고 생각한다.

---

## 골랐다면

힌트는 이렇다. 사람들이 "AI가 썼네" 하고 느끼는 지점은 대개 이런 것들이다.

- **"결과적으로", "즉"** 으로 문단마다 정리하려는 버릇
- **"~한 것이다", "~라는 점에 있다"** 처럼 빙 둘러 닫는 결말
- **"~를 통해"** 번역투, **"양날의 검"** 같은 박제된 비유
- **"~라고 생각한다", "~ㄹ 것이다"** 로 괜히 한 발 빼는 말투
- 모든 문장이 비슷한 길이로, 똑같이 **"~다"** 로 끝나는 균일한 리듬

이 신호가 어느 쪽에 몰려 있는지 보면 답이 드러난다. 사건도 코드도 결론도 완전히 똑같으니, 오직 문체만 보면 된다.

아래 검은 막대를 **드래그하면(마우스로 긁기 / 모바일은 길게 눌러 선택)** 정답이 보인다.

<p style="text-align:center;margin:32px 0;">
<span style="background:var(--text);color:var(--text);padding:6px 14px;border-radius:6px;font-weight:600;user-select:all;">정답 → 글 B 가 손 안 댄 raw AI 입니다.</span>
</p>

글 A는 그 글 B를 `im-not-ai`로 윤문한 결과다.

---

## 도구가 실제로 바꾼 것

감으로 고친 게 아니다. `im-not-ai`를 진짜로 설치해서 돌렸고, 도구가 글 B(raw)에서 잡아낸 패턴은 이랬다.

| 패턴 | before → after |
|---|---|
| `결과적으로 / 즉` (결산 상투구) | 2 → 0 |
| `~한 것이다` 빙 두른 결말 | 3 → 0 |
| `문제의 본질은 ~점에 있다` | 1 → 0 |
| `이 경험을 통해` (번역투) | 1 → 0 |
| `양날의 검` 박제된 비유 | 1 → 0 |
| `~라고 생각한다` 발 빼기 | 1 → 0 |
| `~다` 균일한 종결 | 다수 → 다양화 |

변경률은 약 28%. 코드 두 블록은 한 글자도 안 건드렸다 — 도구의 Do-NOT 규칙상 코드·수치·고유명사·기술 용어(`idempotency` 같은)는 애초에 윤문 대상이 아니다. 바뀐 건 오직 **문장의 골격과 리듬**이다.

## 그래서 뭐가 남았나

재밌는 건, 글 A(윤문본)도 결국 **AI가 쓴 글이라는 사실은 안 변한다는 거다.** AI 티를 지운다고 사람이 쓴 글이 되는 게 아니라, "AI 티가 덜 나는 AI 글"이 될 뿐이다.

그런데 그게 별거 아니냐면, 또 그렇지도 않다. 우리가 "AI가 썼네"라고 느끼는 건 대부분 **내용이 아니라 문체** 때문이니까. 같은 장애 회고, 같은 멱등키 코드인데도 — "결과적으로"로 정리하고 "양날의 검"으로 닫고 같은 어미를 반복하는 그 습관만 걷어내면 인상이 확 바뀐다.

한 번에 골랐다면, 이미 AI 문체의 지문을 읽고 있는 셈이다.

## 그래서, 그게 느껴졌을까

`im-not-ai`가 "중점적으로 잡는다"고 내세우는 패턴은 결국 이런 것들이다 — 번역투("~를 통해"), 기계적 나열, "결론적으로"·"즉" 같은 상투구, "양날의 검"식 박제된 비유, 그리고 균일한 리듬.

궁금한 건 여기다. 윤문본인 글 A에서 이 패턴들이 정말 **덜** 느껴졌을까? 아니면 손을 댔어도 어딘가 AI 냄새는 그대로 남아 있었을까?

raw를 한 번에 골라냈다면 결정적인 한 끗은 무엇이었는지 — 댓글로 남겨주면 이 실험의 다음 표본이 된다.

(이 글의 도입과 해설은 사람과 함께 기획한 실험이고, 두 샘플 글과 그 안의 일화·코드는 위에 적은 그대로 전부 claude code가 지어내 썼다.)
