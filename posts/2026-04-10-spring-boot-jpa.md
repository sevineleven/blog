---
title: "Spring Boot + JPA 삽질 모음"
date: 2026-04-10T13:41:00Z
category: 백엔드
tags: [Spring, JPA, 백엔드, Java]
excerpt: "이론으로 알던 것들이 실제로 터지고 나서야 제대로 이해했다."
draft: false
---

JPA를 쓰다 보면 이론으로 알고 있던 것들이 실제로 터지는 순간이 온다. 그때서야 "아, 이게 이거였구나" 싶다. 그 순간들을 모아봤다.

## 같은 클래스 안에서 `@Transactional`이 안 먹혔다

`REQUIRES_NEW`로 설정해놨는데 왜 적용이 안 되는 거지? 하고 한참 헤맸다.

원인은 Spring AOP 프록시였다. Spring의 트랜잭션은 빈을 프록시로 감싸서 동작한다. 외부에서 호출할 때는 이 프록시를 통과하지만, 같은 클래스 안에서 `this.메서드()`로 호출하면 프록시를 우회하게 된다. 트랜잭션이 적용될 타이밍을 그냥 건너뛰는 거다.

```java
@Service
public class PostService {

    // 이렇게 하면 안 됨 — 같은 클래스 내 호출은 프록시 우회
    public void outer() {
        this.inner(); // @Transactional(propagation = REQUIRES_NEW) 무시됨
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void inner() { ... }
}
```

해결 방법은 `inner()`를 별도 빈으로 분리하는 거다.

```java
@Service
public class PostInnerService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void inner() { ... }
}

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostInnerService innerService;

    public void outer() {
        innerService.inner(); // 프록시 통과 → 트랜잭션 적용됨
    }
}
```

처음엔 이해가 잘 안 됐는데, Spring이 빈을 어떻게 관리하는지 그림이 그려지고 나서야 납득이 됐다.

## Soft Delete, 조건 자동으로 붙이기

삭제된 데이터를 실제로 지우지 않고 플래그로 남기는 soft delete. 처음엔 모든 쿼리에 `deleted_at IS NULL` 조건을 직접 달았다.

당연히 누락이 생겼다. 조회 메서드 하나 새로 만들 때마다 빠뜨리는 거다.

```java
// 이걸 모든 쿼리에 달아야 한다면...
@Query("select p from Post p where p.deletedAt is null")
List<Post> findAll();
```

`@SQLDelete`와 `@Where`로 해결했다.

```java
@Entity
@SQLDelete(sql = "UPDATE post SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class Post {
    private LocalDateTime deletedAt;
}
```

`repository.delete(post)`를 호출하면 실제 DELETE 대신 `deleted_at`을 채우는 UPDATE가 나간다. `@Where`는 모든 조회에 자동으로 조건을 붙여준다.

한 가지 주의할 점은 JPQL이나 `@Query`에서는 `@Where`가 무시될 수 있다는 거다. 직접 작성한 쿼리에는 여전히 조건을 명시해야 한다.

## LAZY인데 왜 쿼리가 바로 나가지? — Lombok `@ToString` 때문이다

`FetchType.LAZY`로 설정했는데 어차피 쿼리가 나간다고 느낀 적이 있었다. 알고 보니 로그 출력하는 곳에서 `toString()`이 연관 컬렉션을 건드리고 있었다.

Lombok의 `@ToString`이 범인이었다. 자동으로 모든 필드를 출력하는데, 거기에 LAZY 컬렉션이 포함되어 있으면 그 시점에 쿼리가 나간다.

```java
@Entity
@ToString(exclude = "comments") // LAZY 컬렉션은 제외하자
public class Post {
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments;
}
```

로그 찍으려다 쿼리가 추가로 나가는 아이러니한 상황. `@Data` 쓰면 `@ToString`이 자동으로 붙어서 더 조심해야 한다.

## 엔티티에 비즈니스 로직을 넣을지 말지

서비스 레이어에 로직을 다 몰아넣다 보면 서비스가 비대해진다. 도메인 로직은 엔티티 안에 넣는 방식도 있다.

```java
@Entity
public class Post {
    private PostStatus status;
    private LocalDateTime publishedAt;

    public void publish() {
        if (this.status != PostStatus.DRAFT) {
            throw new IllegalStateException("draft 상태에서만 publish 가능");
        }
        this.status = PostStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
    }
}
```

서비스에서 `post.setStatus(PUBLISHED)` 하고 `post.setPublishedAt(now())` 두 줄 치는 것보다, `post.publish()` 한 줄이 의도가 명확하고 검증 로직도 엔티티 안에서 보장된다. 이걸 리치 도메인 모델이라고 부르는데, 익숙해지면 이쪽이 더 자연스럽다.
