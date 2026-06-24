import { getAllPosts } from '@/lib/posts';

export const dynamic = 'force-static';

export function GET() {
  const posts = getAllPosts().slice(0, 20);
  const siteUrl = 'https://blog.sevin.dev';

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/posts/${post.slug}`;
      // post.date format: "2025-01-15 00:00 KST" → parse YYYY-MM-DD part
      const datePart = post.date.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
      const pubDate = datePart ? new Date(datePart).toUTCString() : '';
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <category><![CDATA[${post.category}]]></category>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>sevin.dev | blog</title>
    <link>${siteUrl}</link>
    <description>배우고 기록하는 개발자의 공간</description>
    <language>ko</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
