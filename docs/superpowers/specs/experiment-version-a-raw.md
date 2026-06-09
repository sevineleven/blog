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
