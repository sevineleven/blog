import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getAllPosts, getAdjacentPosts } from '@/lib/posts';
import '@/app/posts/prose.css';

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title} | sevin.dev`, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <div>
      {/* 브레드크럼 프롬프트 */}
      <div style={{ marginBottom: 28, fontSize: 13 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: 'var(--green)' }}>sevin</span>
          <span style={{ color: 'var(--muted)' }}>@blog</span>
          <span style={{ color: 'var(--text)' }}>:</span>
          <span style={{ color: 'var(--blue)' }}>~/posts</span>
        </Link>
        <span style={{ color: 'var(--text)' }}>$ </span>
        <span style={{ color: 'var(--text)' }}>cat </span>
        <span style={{ color: 'var(--yellow)' }}>{slug}.md</span>
      </div>

      {/* 포스트 헤더 */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        paddingBottom: 20,
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {post.tags.map((t) => (
            <Link key={t} href={`/?tag=${t}`} style={{
              color: 'var(--purple)',
              fontSize: 12,
              textDecoration: 'none',
            }}>
              #{t}
            </Link>
          ))}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 8 }}>
          {post.title}
        </h1>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{post.date}</span>
      </div>

      {/* 본문 */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* 이전/다음 */}
      <div style={{
        marginTop: 48,
        paddingTop: 20,
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        fontSize: 13,
      }}>
        {prev ? (
          <Link href={`/posts/${prev.slug}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 4 }}>← prev</div>
            <span style={{ color: 'var(--green)' }}>▸ </span>{prev.title}
          </Link>
        ) : <div />}
        {next && (
          <Link href={`/posts/${next.slug}`} style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'right' }}>
            <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 4 }}>next →</div>
            {next.title}<span style={{ color: 'var(--green)' }}> ◂</span>
          </Link>
        )}
      </div>
    </div>
  );
}
