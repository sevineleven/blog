import { getAllPosts, getPostRawContent } from '@/lib/posts';

export const dynamic = 'force-static';

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = 'https://blog.sevin.dev';

  const sections = posts.map((post) => {
    const content = getPostRawContent(post.slug) ?? '';
    return [
      `# ${post.title}`,
      `URL: ${siteUrl}/posts/${post.slug}`,
      `Date: ${post.date}`,
      `Category: ${post.category}`,
      `Tags: ${post.tags.join(', ')}`,
      '',
      content.trim(),
      '',
      '---',
      '',
    ].join('\n');
  });

  const full = [
    '# sevin.dev — Full Content',
    '',
    '> 배우고 기록하는 개발자의 공간. 프론트엔드, 백엔드, 일상 개발 경험을 기록합니다.',
    '',
    '---',
    '',
    ...sections,
  ].join('\n');

  return new Response(full, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
