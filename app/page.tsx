import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';
import PostListItem from '@/components/PostListItem';

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
      {/* 프로필 헤더 */}
      <header style={{ padding: '64px 0 48px' }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            sevin
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            배우고 기록하는 개발자의 공간
          </p>
        </div>
        <Link
          href="/universe"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 16,
            fontSize: 12,
            fontFamily: 'var(--mono)',
            color: 'var(--muted)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 12px',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          className="universe-link"
        >
          <span style={{ color: 'var(--green)' }}>✦</span> universe view
        </Link>
      </header>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          <Link href="/" style={{
            fontSize: 12,
            fontFamily: 'var(--mono)',
            padding: '3px 10px',
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
              fontFamily: 'var(--mono)',
              padding: '3px 10px',
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

      {/* 섹션 레이블 */}
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: 'var(--muted)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: 'var(--green)' }}>$</span>
        <span>posts {tag ? `--tag=${tag}` : ''}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
      </div>

      {/* 포스트 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
            no posts found.
          </p>
        )}
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
