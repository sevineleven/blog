import { getAllPosts } from '@/lib/posts';

export const dynamic = 'force-static';

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = 'https://blog.sevin.dev';

  const lines = [
    '# sevin.dev',
    '',
    '> 배우고 기록하는 개발자의 공간. 프론트엔드, 백엔드, 일상 개발 경험을 기록합니다.',
    '> 한국어로 작성된 기술 블로그입니다.',
    '',
    '## Blog Posts',
    '',
    ...posts.map((p) => `- [${p.title}](${siteUrl}/posts/${p.slug}): ${p.excerpt}`),
    '',
    '## Links',
    '',
    `- [홈](${siteUrl})`,
    `- [전체 콘텐츠](${siteUrl}/llms-full.txt)`,
    `- [sitemap](${siteUrl}/sitemap.xml)`,
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
