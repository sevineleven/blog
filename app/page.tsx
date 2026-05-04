import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const posts = getAllPosts().filter((p) => !tag || p.tags.includes(tag));
  const tags = getAllTags();

  return (
    <div>
      {/* 프롬프트 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <span style={{ color: 'var(--green)' }}>sevin</span>
        <span style={{ color: 'var(--muted)' }}>@blog</span>
        <span style={{ color: 'var(--text)' }}>:</span>
        <span style={{ color: 'var(--blue)' }}>~</span>
        <span style={{ color: 'var(--text)' }}>$ </span>
        <span style={{ color: 'var(--text)' }}>ls posts/</span>
        {!tag && <span style={{ color: 'var(--muted)' }}></span>}
        {tag && (
          <span style={{ color: 'var(--muted)' }}> --tag=<span style={{ color: 'var(--yellow)' }}>{tag}</span></span>
        )}
      </div>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link href="/" style={{
            fontSize: 12,
            padding: '2px 10px',
            borderRadius: 4,
            border: `1px solid ${!tag ? 'var(--green)' : 'var(--border)'}`,
            color: !tag ? 'var(--green)' : 'var(--muted)',
            textDecoration: 'none',
          }}>
            all
          </Link>
          {tags.map((t) => (
            <Link key={t} href={`/?tag=${t}`} style={{
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 4,
              border: `1px solid ${tag === t ? 'var(--green)' : 'var(--border)'}`,
              color: tag === t ? 'var(--green)' : 'var(--muted)',
              textDecoration: 'none',
            }}>
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* 포스트 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {posts.length === 0 && (
          <span style={{ color: 'var(--muted)' }}>No entries found.</span>
        )}
        {posts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr',
              gap: '0 20px',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.1s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: 'var(--muted)', fontSize: 13, paddingTop: 1 }}>{post.date}</span>
              <div>
                <span style={{ color: 'var(--green)', marginRight: 6 }}>▸</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{post.title}</span>
                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                  {post.tags.map((t) => (
                    <span key={t} style={{ color: 'var(--purple)', fontSize: 12 }}>#{t}</span>
                  ))}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                  {post.excerpt}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 하단 프롬프트 */}
      <div style={{ marginTop: 28 }}>
        <Link href="/universe" style={{ textDecoration: 'none' }}>
          <span style={{ color: 'var(--green)' }}>sevin</span>
          <span style={{ color: 'var(--muted)' }}>@blog</span>
          <span style={{ color: 'var(--text)' }}>:</span>
          <span style={{ color: 'var(--blue)' }}>~</span>
          <span style={{ color: 'var(--text)' }}>$ </span>
          <span style={{ color: 'var(--muted)' }}>open universe<span className="cursor" /></span>
        </Link>
      </div>
    </div>
  );
}
