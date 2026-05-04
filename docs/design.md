# 블로그 설계 문서

## 개요

sevin.dev 개인 기술 블로그. Markdown 파일을 Git에 올리면 자동으로 블로그 포스팅이 되는 구조.

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| MD 파싱 | gray-matter + remark / rehype |
| 우주 그래프 | Three.js |
| 배포 | Vercel |
| 댓글 | Giscus (GitHub Discussions) |

---

## 디렉토리 구조

```
blog/
├── posts/                  # MD 블로그 포스트
│   └── YYYY-MM-DD-slug.md
├── app/
│   ├── page.tsx            # 홈 (목록 뷰)
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx    # 포스트 상세
│   └── universe/
│       └── page.tsx        # 우주 그래프 뷰
├── components/
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   └── universe/
│       └── UniverseGraph.tsx
├── lib/
│   ├── posts.ts            # MD 파싱 유틸
│   └── graph.ts            # 그래프 노드/엣지 생성
├── docs/
│   └── design.md           # 이 파일
└── scripts/
    └── new-post.mjs        # 새 포스트 생성 CLI
```

---

## 포스트 Frontmatter 스펙

```md
---
title: "포스트 제목"
date: 2026-05-04
tags: [spring, java, backend]
draft: false
excerpt: "포스트 요약 (없으면 본문 앞 150자 자동 생성)"
---

본문 내용...
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | ✅ | 포스트 제목 |
| `date` | ✅ | 작성일 (YYYY-MM-DD) |
| `tags` | ✅ | 태그 목록 (우주 그래프 연결 기준) |
| `draft` | ✅ | `true`면 빌드에서 제외 |
| `excerpt` | ❌ | 요약. 없으면 본문 앞 150자 자동 사용 |

---

## 뷰 구성

### 1. 목록 뷰 (홈)

- 날짜 역순 카드 리스트
- 제목, 날짜, 태그, excerpt 표시
- 태그 클릭으로 필터링
- `draft: true` 포스트는 노출 제외

### 2. 포스트 상세

- MD → HTML 렌더링
- 코드 하이라이팅 (rehype-highlight 또는 shiki)
- 이전글 / 다음글 네비게이션
- Giscus 댓글

### 3. 우주 그래프 뷰 (`/universe`)

- 포스트 = 별(노드)
- 공통 태그 = 연결선(엣지)
- 같은 태그끼리 중력으로 클러스터
- Three.js force-directed 3D 그래프
- 노드 클릭 → 해당 포스트로 이동
- 노드 hover → 포스트 제목 tooltip
- 배경: 어두운 우주 + 별빛 파티클

---

## 글쓰기 워크플로우

```
1. posts/ 에 MD 파일 생성
   → npm run new-post "제목"  (로컬)
   → GitHub 웹 UI에서 직접 생성  (에디터 없이)

2. 내용 작성 후 draft: false 설정

3. git push → Vercel 자동 빌드 → 발행
```

### `npm run new-post` 사용법

```bash
npm run new-post "Spring Boot 시작하기"
# → posts/2026-05-04-spring-boot-시작하기.md 생성
# → frontmatter 자동 채워진 채로 열림
```

---

## 인프라 & 배포

### 도메인 구조

```
sevin.dev          → 포트폴리오 (sevineleven/portfolio)
blog.sevin.dev     → 블로그 (sevineleven/blog)
```

### 배포 흐름

```
GitHub push (main)
  └→ Vercel 자동 빌드 & 배포
```

각 프로젝트를 Vercel에 연결하고, 커스텀 도메인 설정:
- `sevineleven/portfolio` → `sevin.dev`
- `sevineleven/blog` → `blog.sevin.dev`

### DNS 설정 (도메인 구매처에서)

```
Type   Name    Value
CNAME  blog    cname.vercel-dns.com
```

- 서버 불필요, 별도 Nginx 불필요
- `main` 브랜치 push → Vercel 자동 빌드 → 발행

---

## 로드맵

### Phase 1 — 기본 블로그
- [ ] MD 파싱 및 포스트 목록/상세
- [ ] `new-post` 스크립트
- [ ] 코드 하이라이팅
- [ ] 반응형 레이아웃

### Phase 2 — 우주 그래프
- [ ] Three.js 우주 그래프 (`/universe`)
- [ ] 태그 기반 노드 클러스터링
- [ ] 별빛 파티클 배경
- [ ] 노드 인터랙션 (hover, click)

### Phase 3 — 부가 기능
- [ ] Giscus 댓글
- [ ] 태그 필터링
- [ ] RSS 피드
- [ ] OG 이미지 자동 생성
