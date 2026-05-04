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
      <header style={{ paddingBottom: 48, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 10 }}>
          sevineleven
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          배우고 기록하는 개발자의 공간
        </p>
        <Link
          href="/universe"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 20,
            fontFamily: 'var(--mono)',
            fontSize: 12,
            color: 'var(--muted)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 14px',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--green)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,214,140,0.35)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ color: 'var(--green)' }}>✦</span>
          universe view
        </Link>
      </header>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '28px 0' }}>
          <Link href="/" style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 5,
            border: `1px solid ${!tag ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
            color: !tag ? 'var(--green)' : 'var(--muted)',
            textDecoration: 'none',
            background: !tag ? 'rgba(61,214,140,0.07)' : 'transparent',
            transition: 'all 0.15s',
          }}>
            all
          </Link>
          {tags.map((t) => (
            <Link key={t} href={`/?tag=${t}`} style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 5,
              border: `1px solid ${tag === t ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
              color: tag === t ? 'var(--green)' : 'var(--muted)',
              textDecoration: 'none',
              background: tag === t ? 'rgba(61,214,140,0.07)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* 섹션 레이블 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
        paddingTop: tags.length === 0 ? 32 : 0,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          ls posts/{tag ? ` --tag=${tag}` : ''}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* 포스트 목록 */}
      <div>
        {posts.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, padding: '32px 0' }}>
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
