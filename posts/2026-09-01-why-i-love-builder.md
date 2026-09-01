---
title: "[Java] 내가 Builder를 좋아하는 이유"
date: 2026-09-01T11:20:00Z
category: 백엔드
tags: [백엔드, Java, Lombok, 디자인패턴]
excerpt: "빌더는 인자가 많을 때 쓰는 거라고 배웠다. 혼자 백엔드를 맡고 나서 알게 된 건 좀 달랐다. 같은 타입 인자 둘이 뒤바뀌어도 컴파일러는 아무 말을 안 한다는 것. 내가 빌더를 고르는 진짜 기준과 안 쓰는 경우까지 정리했다."
draft: false
---

Lombok을 처음 알았을 때가 기억난다.

엔티티에 `@Getter` `@Setter` 두 줄만 붙이면 메서드가 알아서 생긴다. Lombok을 안 쓰더라도 IntelliJ의 Generate 메뉴에서 Getter and Setter를 고르면 필드 전체 것을 한 번에 뽑아준다.

![IntelliJ IDEA의 Generate 팝업 메뉴](/posts/why-i-love-builder/intellij-generate-getter-setter.png)

그때는 그게 그렇게 좋았다. 손으로 안 써도 되니까.

그래서 객체를 이렇게 만들었다.

```java
Order order = new Order();
order.setUserId(userId);
order.setCourseId(courseId);
order.setPublished(false);
order.setCreatedAt(LocalDateTime.now());
```

메서드 안에서 객체 하나 만들고, setter를 줄줄이 호출해서 채운다. 필드 이름이 다 보이니까 이게 제일 읽기 쉬운 줄 알았다.

싸피 다닐 때 유빈이형([@pcjs156](https://github.com/pcjs156))이랑 프로젝트를 세 번 같이 했다. 그 형한테 배운 게 정말 많은데, 그중 하나가 이거였다.

> getter는 좋은데, setter를 그냥 다 박아버리는 건 보안상 위험이 커질 확률이 높아진다. 그런 것도 한번 생각해보면 어떻겠냐.

그러면서 빌더를 알려줬다. 그 뒤로 나는 계속 빌더만 쓰고 있다.

처음엔 솔직히 "그런가 보다" 하고 따라 썼다. **왜** 좋은지를 내 말로 설명할 수 있게 된 건 한참 뒤, 혼자 백엔드를 맡고 나서였다.

## setter로 조립하면, 조립 중인 객체가 이미 세상에 나와 있다

`new Order()` 가 실행된 순간부터 그 객체는 존재한다. `setUserId` 와 `setCreatedAt` 사이의 그 짧은 구간에도 존재한다. 그 구간의 `order` 는 **아직 완성되지 않았지만 이미 남에게 넘길 수 있는** 객체다.

이걸 Effective Java에서는 JavaBeans 패턴의 **일관성이 깨진 상태(inconsistent state)** 라고 부른다. 조립이 끝나기 전에 그 객체가 어딘가로 새면, 받는 쪽은 반쯤 빈 객체를 정상인 줄 알고 쓴다.

그리고 하나 더. setter가 열려 있는 한 그 객체는 **영원히 불변이 될 수 없다.** 만들 때 한 번 쓰라고 열어둔 문이 서비스 코드 아무 데서나 열린다.

빌더는 이 구간 자체를 없앤다. `build()` 가 불리기 전까지 객체는 아예 태어나지 않는다. 태어날 땐 이미 완성품이다.

여기까지가 검색하면 어느 글에나 나오는 이야기다. 점층적 생성자 → setter → 빌더. 나도 그렇게 배웠다.

그런데 내가 실제로 프로젝트를 혼자 맡고 나서 빌더를 고집하게 된 이유는 이게 아니었다.

## 진짜 이유는 타입 시스템에 구멍이 있어서다

> 빌더는 읽기 좋으라고 쓰는 게 아니다. **컴파일러가 못 잡는 자리를 대신 잡으라고** 쓴다.

offway 백엔드를 짜면서 푸시 알림에 실어 보낼 메시지 객체를 만들었다.

```java
@Builder
public record PushMessage(NotificationType type, Long courseId, Long notificationId, Integer badge) {
    public PushMessage {
        Objects.requireNonNull(type, "알림 종류는 null 일 수 없습니다.");
        Objects.requireNonNull(notificationId, "알림 id 는 null 일 수 없습니다.");
    }
}
```

`courseId` 와 `notificationId` 를 보자. **둘 다 `Long` 이다.**

생성자로 조립하면 이렇게 된다.

```java
new PushMessage(type, notificationId, courseId, badge);  // 두 번째와 세 번째가 바뀐 코드
```

이게 컴파일된다. 타입이 같으니까 컴파일러는 아무 불만이 없다. 테스트도 웬만하면 통과한다 — 테스트 픽스처에서 `1L`, `2L` 같은 걸 넣으면 값이 뭐가 됐든 객체는 잘 만들어진다.

그럼 언제 드러나느냐. **실기기에서 푸시를 눌렀을 때** 드러난다. 앱이 엉뚱한 알림을 읽음 처리하고, 엉뚱한 코스로 이동한다.

컴파일러도, 테스트도, 코드 리뷰어도 못 잡는다. 리뷰어는 `new PushMessage(type, a, b, badge)` 를 보고 a와 b의 순서가 맞는지 확인하려면 record 선언부로 이동해야 한다. 그걸 매번 하는 사람은 없다.

그래서 이 객체는 조립을 `builder()` 로만 열었다.

```java
PushMessage message = PushMessage.builder()
        .type(target.type())
        .courseId(target.courseId())
        .notificationId(target.notificationId())
        .badge(badges.get(target.userId()))
        .build();
```

이제 순서를 바꿔 써도 아무 일이 안 일어난다. `.courseId()` 에 들어가는 값은 무슨 일이 있어도 `courseId` 가 된다. **위치가 아니라 이름으로 넘기기 때문이다.**

남들 글이 "가독성"이라고 부르는 게 사실 이거였다. 읽기 편한 게 아니라, **읽지 않아도 틀릴 수가 없는 것.** 나한테는 이게 훨씬 중요했다.

## boolean 두 개가 나란히 있으면 더 위험하다

`Long` 두 개는 그래도 값이 다르면 티가 난다. 진짜 무서운 건 `boolean` 이다.

큐레이션 링크(앱에서 외부 페이지로 나가는 칩) 엔티티는 필드가 열둘이다. 그중 문자열이 다섯이고, 이런 게 나란히 있다.

```java
boolean alwaysOn,     // 상시 노출인가
...
boolean published,    // 앱에 실제로 내보낼 것인가
```

이 둘이 뒤바뀌면 어떻게 되냐면 — 어드민이 **만들다 만 항목이 사용자 앱에 나가거나**, 기간이 정해진 항목이 영구 노출로 굳는다.

그리고 컴파일은 통과한다. `true` 와 `false` 는 그냥 `true` 와 `false` 니까.

그래서 저 엔티티도 빌더로만 연다. 나는 **같은 타입 인자가 두 개 이상 나란히 서는 순간을 빌더의 신호로 본다.** 인자 개수가 몇 개냐보다 이게 훨씬 정확한 기준이라고 생각한다.

## 정적 팩토리 vs 빌더는 고르는 문제가 아니었다

여기서 한 번 헤맸다.

저 엔티티는 검증할 게 많다. URL은 `https` 만 받고, 칩 문구는 30자를 넘으면 안 되고, 상시가 아니면 종료일이 반드시 있어야 한다. 그래서 처음엔 "검증이 본체니까 정적 팩토리 메서드로 열어야지" 하고 그렇게 뒀다.

그러다 알았다. **둘은 배타적이지 않다.**

`@Builder` 를 클래스가 아니라 **생성자에** 붙이면, Lombok이 만드는 빌더의 `build()` 는 결국 그 생성자를 호출한다. 즉 생성자에 넣은 검증이 빌더로 만들어도 똑같이 돈다.

```java
@Builder
private CuratedLink(
        String title,
        String chipText,
        ...
        boolean alwaysOn,
        Set<Surface> surfaces,
        int displayOrder,
        boolean published,
        String updatedBy) {
    apply(title, chipText, ..., alwaysOn, surfaces, displayOrder, published, updatedBy);
}
```

생성자를 `private` 으로 막았으니 밖에서는 **빌더 말고 다른 길이 없다.** 그런데 검증은 생성자가 한다. 정적 팩토리를 따로 둘 이유가 없어졌다.

이게 `@Builder` 를 클래스가 아니라 생성자에 붙이는 이유이기도 하다. 클래스에 붙이면 Lombok이 전체 필드를 받는 생성자를 자기가 만들어 쓰기 때문에, 내가 쓴 검증 코드를 그냥 지나칠 수 있다. 알림 엔티티도 같은 모양으로 짰다.

```java
@Builder
private Notification(UUID userId, NotificationType type, Long courseId, LocalDateTime createdAt) {
    this.userId = requireOwner(userId);
    this.type = Objects.requireNonNull(type, "알림 종류는 필수입니다");
    this.courseId = courseId;
    this.createdAt = Objects.requireNonNull(createdAt, "생성 시각은 필수입니다");
}
```

setter는 아예 없다. 상태를 바꿀 일이 생기면 그때 메서드를 하나 만들지, 문을 열어두진 않는다.

## 테스트에서 제일 크게 체감했다

의외로 빌더가 제일 고맙던 자리는 프로덕션 코드가 아니라 테스트였다.

장소의 보조정보를 담는 record가 하나 있는데 필드가 열한 개다. 운영시간, 휴무일, 주차, 요금, 대표메뉴, 객실 수... 카테고리마다 채워지는 칸이 다르다. 그래서 "**아무 칸이나 하나만 차면 빈 응답이 아니다**"라는 판정 메서드를 테스트해야 했다.

생성자였다면 이랬을 거다.

```java
new PoiIntro(null, null, null, null, "갈치조림정식", null, null, null, null, null, null);
```

지금은 이렇다.

```java
assertTrue(PoiIntro.builder().build().isEmpty());
assertFalse(PoiIntro.builder().signatureMenu("갈치조림정식").build().isEmpty());
assertFalse(PoiIntro.builder().roomCount("13실").build().isEmpty());
assertFalse(PoiIntro.builder().experienceGuide("목공예 체험 / 도자기 체험").build().isEmpty());
```

한 줄만 봐도 **이 테스트가 뭘 검증하는지** 보인다. 위쪽 코드는 그게 `null` 더미에 묻힌다. 그리고 나중에 필드가 하나 늘어도 위쪽은 테스트를 전부 고쳐야 하지만, 아래쪽은 아무것도 안 고쳐도 된다.

## Lombok `@Builder` 에서 조심할 것

편한 만큼 조용히 물리는 데가 있다.

**필드 선언부에 쓴 기본값을 무시한다.** 이게 제일 유명한 함정이다.

```java
@Builder
public class Cart {
    private List<Item> items = new ArrayList<>();  // 빌더로 만들면 이거 null 이다
}
```

빌더가 만드는 건 별도의 빌더 클래스고, 그쪽 필드는 Java 기본값(`null` / `0` / `false`)으로 시작한다. 필드에 써둔 초기화는 안 본다. 막으려면 `@Builder.Default` 를 붙여야 한다.

참고로 내 프로젝트에는 `@Builder.Default` 가 한 곳도 없다. 기본값을 필드 선언부에 두지 않고 생성자에서 정하거나 아예 필수로 받는 스타일이라 그렇게 됐다. 함정을 피한 게 아니라 함정에 갈 일이 없게 짠 쪽에 가깝다.

**그리고 필수값 누락은 컴파일에 안 걸린다.** 이건 빌더 자체의 약점이다. 생성자였다면 인자를 빼먹으면 컴파일이 막아줬을 텐데, 빌더는 `build()` 를 그냥 통과시킨다. 실제로 이걸 근거로 [빌더를 안티패턴이라 부르는 글](https://dev.to/siy/when-builder-is-anti-pattern-3j92)도 있다. 컴파일 타임 검증을 런타임으로 미룬다는 지적인데, 맞는 말이다.

컴파일 타임에 강제하려면 필드마다 인터페이스를 만드는 staged builder나 Jilt 같은 라이브러리를 써야 한다. 나는 거기까진 안 갔다. 대신 **생성자에서 `Objects.requireNonNull` 로 잡는다.** 앞에서 본 그 구조다. 컴파일 타임은 아니지만, 최소한 `build()` 하는 그 줄에서 즉시 터진다. 값이 `null` 인 채로 DB까지 흘러가서 한참 뒤에 NPE로 만나는 것보다 훨씬 낫다.

완벽한 해결은 아니다. 트레이드오프를 알고 고른 쪽이다.

## 그래서 나는 언제 빌더를 안 쓰나

이 절이 이 글에서 제일 쓰고 싶었던 부분이다. 빌더 글은 많은데 "언제 안 쓰는지"를 쓴 글은 잘 없다.

내 기준은 이렇다.

| 상황 | 내 선택 |
|---|---|
| 필드 2~3개, 타입이 다 다름 | 그냥 record 생성자 |
| 같은 타입 인자가 둘 이상 나란히 | **빌더** |
| `boolean` 이 둘 이상 | **빌더** (제일 위험한 조합) |
| 필드 많은데 대부분 선택값 | **빌더** |
| 만드는 방법이 여러 갈래이고 각각 이름이 있음 | 정적 팩토리 (`of`, `from`, `empty`) |
| 검증이 빡센데 조립도 복잡함 | **빌더 + private 생성자 검증** |

`new Point(x, y)` 에 빌더를 다는 건 그냥 코드만 늘리는 짓이다. `Money.won(1000)` 처럼 **이름 자체가 의미를 말해주는** 경우도 빌더보다 정적 팩토리가 정직하다. 빌더는 이름이 `builder()` 하나뿐이라, 만드는 방법이 여러 갈래일 땐 오히려 의미를 감춘다.

숫자로 보면 offway 백엔드에는 `.builder()` 호출이 136곳, `@Builder` 를 붙인 클래스가 29개다. 클래스 전체 개수에 비하면 많지 않다. 다 바르고 다니진 않는다는 뜻이다.

## 정리하면

- 빌더의 장점으로 흔히 말하는 "가독성"은, 내 경험상 **읽기 편함이 아니라 틀릴 수 없음**에 가깝다
- 인자 개수보다 **같은 타입이 나란히 서 있는지**가 더 정확한 신호다
- `@Builder` 는 클래스보다 **private 생성자**에 붙인다. 검증과 빌더를 동시에 가져갈 수 있다
- 필수값 누락은 컴파일에 안 걸린다. `Objects.requireNonNull` 로 최소한 즉시 터지게 만든다
- 필드 두세 개짜리에 빌더를 다는 건 그냥 보일러플레이트다

유빈이형이 "그런 것도 한번 생각해보면 어떻겠냐"고 했을 때, 나는 그 말을 이해하고 따른 게 아니라 그냥 따랐다. setter로 조립하던 코드가 왜 불안한지 언어로 설명하지 못했으니까.

지금은 "조립 중인 객체가 이미 세상에 나와 있다"고 말할 수 있게 됐다. 배운 걸 이유까지 말할 수 있게 되는 게 성장인 것 같다.

아직 staged builder까지는 안 가봤으니, 그건 다음 숙제로 남겨둔다.
