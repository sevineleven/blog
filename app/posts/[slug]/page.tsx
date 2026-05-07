import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getAllPosts, getAdjacentPosts, getSeriesPosts } from '@/lib/posts';
import Comments from '@/components/Comments';
import ViewTracker from '@/components/ViewTracker';
import BlogToc from '@/components/BlogToc';
import ReadingProgress from '@/components/ReadingProgress';
import ProseContent from '@/components/ProseContent';
import SeriesBox from '@/components/SeriesBox';
import '@/app/posts/prose.css';

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const url = `https://blog.sevin.dev/posts/${slug}`;
  return {
    title: `${post.title} | sevin.dev`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    alternates: { canonical: url },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const seriesPosts = post.series ? getSeriesPosts(post.series) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    keywords: post.tags.join(', '),
    url: `https://blog.sevin.dev/posts/${slug}`,
    author: { '@type': 'Person', name: 'sevin', url: 'https://blog.sevin.dev' },
    publisher: { '@type': 'Organization', name: 'sevin.dev', url: 'https://blog.sevin.dev' },
  };

  return (
    <div>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogToc headings={post.headings} />
      {/* 브레드크럼 */}
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: 'var(--muted)',
        marginBottom: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ color: 'var(--green)' }}>$</span>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>~/posts</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{slug}</span>
      </div>

      {/* 포스트 헤더 */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {post.tags.map((t) => (
            <Link key={t} href={`/?tag=${t}`} style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--purple)',
              background: 'rgba(183,148,244,0.08)',
              padding: '2px 8px',
              borderRadius: 3,
              textDecoration: 'none',
            }}>
              #{t}
            </Link>
          ))}
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginBottom: 12,
        }}>
          {post.title}
        </h1>
        <time style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          {post.date}
        </time>
      </header>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 40 }} />

      {seriesPosts && post.series && (
        <SeriesBox series={post.series} posts={seriesPosts} currentSlug={slug} />
      )}

      {/* 본문 */}
      <ProseContent html={post.content} />

      {/* 이전/다음 */}
      <div style={{
        marginTop: 64,
        paddingTop: 24,
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {prev ? (
          <Link href={`/posts/${prev.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>← prev</div>
            <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{prev.title}</div>
          </Link>
        ) : <div />}
        {next && (
          <Link href={`/posts/${next.slug}`} style={{ textDecoration: 'none', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>next →</div>
            <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{next.title}</div>
          </Link>
        )}
      </div>

      <ViewTracker slug={slug} />
      <Comments slug={slug} />
    </div>
  );
}
