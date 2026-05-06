---
title: "PostgreSQL 인덱스 제대로 쓰기"
date: 2026-02-14T04:44:00Z
category: 백엔드
tags: [PostgreSQL, 데이터베이스, 백엔드]
excerpt: "슬로우 쿼리 알림 받고 나서야 인덱스를 진지하게 보기 시작했다."
draft: false
---

슬로우 쿼리 알림이 처음 울렸을 때 당황했다. 로컬에서 테스트할 때는 데이터가 몇 백 건이라 문제없었는데, 운영에선 수십만 건이 쌓여 있었다.

## 일단 EXPLAIN ANALYZE부터

뭔가 느리다 싶으면 실행 계획 먼저 본다.

```sql
EXPLAIN ANALYZE
SELECT * FROM posts WHERE author_id = 42 AND status = 'published'
ORDER BY created_at DESC LIMIT 10;
```

`Seq Scan`이 뜨면 테이블 전체를 순차 탐색하고 있다는 뜻이다. 인덱스 없다는 거다.

## 복합 인덱스는 순서가 중요하다

이걸 처음엔 몰랐다.

```sql
-- author_id로 필터 → created_at으로 정렬하는 쿼리가 자주 있다면
CREATE INDEX idx_posts_author_created
ON posts(author_id, created_at DESC);
```

이 인덱스는 `WHERE author_id = ?` 조건에는 쓰인다. 근데 `WHERE created_at > ?` 단독 조건에는 쓰이지 않는다. 앞 컬럼부터 순서대로 써야 한다.

## 부분 인덱스 - 인덱스도 필요한 것만

```sql
CREATE INDEX idx_posts_active
ON posts(created_at DESC)
WHERE deleted_at IS NULL;
```

삭제된 데이터 빼고 살아있는 것만 인덱싱한다. 인덱스 크기가 줄고 성능이 올라간다. 소프트 딜리트 쓰는 테이블에 특히 효과적이다.

## 인덱스가 많다고 좋은 게 아니다

읽기는 빨라지는데 쓰기가 느려진다. 인덱스마다 INSERT/UPDATE/DELETE할 때 같이 갱신되니까. 안 쓰는 인덱스는 오히려 짐이다.

`LIKE '%keyword%'` 패턴은 인덱스를 못 쓴다. 이 경우엔 `pg_trgm` 확장 + GIN 인덱스를 쓰는 게 맞다.
