---
title: "블로그 개발기 - 댓글 알림 구현과 구글 검색 등록"
date: 2026-05-06T00:00:00Z
category: 일상
tags: [블로그, SEO, Google Search Console, Resend]
excerpt: "블로그를 만들고 나서 추가한 것들. 구글 검색에 노출되게 하고, 댓글이 달리면 이메일로 알림 받기."
draft: false
---

블로그를 만들고 나면 쓰는 것 외에도 챙겨야 할 게 있다. 구글에서 검색이 되는지, 댓글이 달렸을 때 알 수 있는지.

기능 자체보다 귀찮아서 미뤄두다가 결국 처리한 것들이다.

## sitemap.xml / robots.txt 추가

구글이 내 블로그를 크롤링하려면 어떤 페이지가 있는지 알아야 한다. 그걸 알려주는 게 `sitemap.xml`이고, 크롤러 접근 정책을 설명하는 게 `robots.txt`다.

Next.js App Router에서는 파일 하나로 자동 생성할 수 있다.

```ts
// app/sitemap.ts
import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://blog.sevin.dev";
  const posts = getAllPosts();

  const postEntries = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    lastModified: new Date(
      post.date.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? Date.now(),
    ),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postEntries,
  ];
}
```

```ts
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://blog.sevin.dev/sitemap.xml",
  };
}
```

배포하면 `https://blog.sevin.dev/sitemap.xml`과 `https://blog.sevin.dev/robots.txt`가 자동으로 생성된다.

포스트 페이지에는 OG 태그와 canonical URL도 추가했다.

```ts
// app/posts/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(slug);
  const url = `https://blog.sevin.dev/posts/${slug}`;
  return {
    title: `${post.title} | sevin.dev`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    alternates: { canonical: url },
  };
}
```

## Google Search Console 등록

### 1. 속성 추가

[Google Search Console](https://search.google.com/search-console)에 접속해서 속성을 추가한다. URL 접두어 방식으로 `https://blog.sevin.dev`를 입력한다.

![구글 콘솔 속성 이미지](/posts/google-search-console-resend/google-console.png)

### 2. 도메인 소유권 인증

DNS TXT 레코드로 인증하는 방법을 선택하면 아래 같은 값을 준다.

```
google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

나는 도메인을 가비아에서 관리하고 있어서 가비아 DNS 설정에서 추가했다.

**가비아 → My가비아 → 도메인 관리 → sevin.dev → DNS 설정**

| 타입 | 호스트 | 값                           |
| ---- | ------ | ---------------------------- |
| TXT  | blog   | google-site-verification=... |

저장 후 Search Console에서 확인 버튼을 누르면 인증 완료된다. DNS 반영에 몇 분 걸릴 수 있다.

### 3. sitemap 제출

Search Console 왼쪽 메뉴 **Sitemaps**에서 `sitemap.xml`을 제출한다.

제출 후 Google이 크롤링을 시작하는 데 며칠 걸린다. **페이지 색인 생성** 탭에서 진행 상황을 확인할 수 있다.

## 댓글 알림 이메일 구현

누군가 댓글을 달면 이메일로 알림을 받고 싶었다. [Resend](https://resend.com)를 사용했다.

### Resend 설정

Resend에 가입하고 API 키를 발급받는다. 그리고 발신 도메인을 등록해야 한다. 나는 `blog.sevin.dev`로 보내도록 설정했다.

도메인 인증도 가비아 DNS에서 Resend가 안내하는 레코드를 추가하면 된다.

환경변수에 API 키와 수신 이메일을 추가한다.

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL=내이메일@gmail.com
```

Vercel 배포 환경이면 Vercel 대시보드 → Settings → Environment Variables에서 추가한다.

### API Route에 알림 추가

댓글 POST API에서 DB 저장 후 Resend로 이메일을 발송한다.

```ts
// app/api/comments/route.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // ... DB 저장

  resend.emails
    .send({
      from: "blog@sevin.dev",
      to: process.env.NOTIFICATION_EMAIL!,
      subject: `[블로그] 새 댓글 - ${post_slug}`,
      text: `${author}: ${body.slice(0, 100)}\n\nhttps://blog.sevin.dev/posts/${post_slug}#comments`,
    })
    .catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
```

`await` 없이 `.catch()`만 달아서 이메일 발송 실패가 댓글 저장에 영향을 주지 않도록 했다.

## 블로그 고도화 현황

이번 글에서 한 것들이다.

- [x] 댓글 알림 이메일 (Resend)
- [x] sitemap.xml / robots.txt
- [x] 포스트 OG 태그
- [x] Google Search Console 등록 + sitemap 제출

아직 남은 것들.

- [ ] 포스트 이미지 캡처 삽입 (이 글)
- [ ] MCP 서버 만들어보기

이제 누군가 댓글을 달면 바로 이메일로 확인할 수 있다.
