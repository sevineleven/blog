import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';
import { supabase } from '@/lib/supabase';
import PostListItem from '@/components/PostListItem';

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; sort?: string }>;
}) {
  const { tag, sort } = await searchParams;

  const { data: viewsData } = await supabase
    .from('post_views')
    .select('slug, count');
  const viewsMap = Object.fromEntries((viewsData ?? []).map((v) => [v.slug, v.count as number]));

  let posts = getAllPosts().filter((p) => !tag || p.tags.includes(tag));
  const tags = getAllTags();

  if (sort === 'views') {
    posts = [...posts].sort((a, b) => (viewsMap[b.slug] ?? 0) - (viewsMap[a.slug] ?? 0));
  }

  const sortHref = (s: string) => {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (s !== 'latest') params.set('sort', s);
    const q = params.toString();
    return q ? `/?${q}` : '/';
  };

  return (
    <div>
      {/* whoami */}
      <header style={{ paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>whoami</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <span style={{ color: 'var(--blue)', marginRight: 12 }}>name</span>
            <span style={{ color: 'var(--text)' }}>parksevin</span>
          </div>
          <div>
            <span style={{ color: 'var(--blue)', marginRight: 16 }}>role</span>
            <span>backend engineer</span>
          </div>
          <div>
            <span style={{ color: 'var(--blue)', marginRight: 8 }}>writing</span>
            <span>배우면서 기록하기</span>
          </div>
          <div>
            <span style={{ color: 'var(--blue)', marginRight: 4 }}>github</span>
            <a href="https://github.com/sevineleven" target="_blank" rel="noopener noreferrer" className="whoami-link">
              github.com/sevineleven
            </a>
          </div>
        </div>
      </header>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '28px 0' }}>
          <Link href={sortHref('latest').replace('/', '') || '/'} style={{
            fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 12px', borderRadius: 5,
            border: `1px solid ${!tag ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
            color: !tag ? 'var(--green)' : 'var(--muted)', textDecoration: 'none',
            background: !tag ? 'rgba(61,214,140,0.07)' : 'transparent',
          }}>
            all
          </Link>
          {tags.map((t) => (
            <Link key={t} href={`/?tag=${t}${sort === 'views' ? '&sort=views' : ''}`} style={{
              fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 12px', borderRadius: 5,
              border: `1px solid ${tag === t ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
              color: tag === t ? 'var(--green)' : 'var(--muted)', textDecoration: 'none',
              background: tag === t ? 'rgba(61,214,140,0.07)' : 'transparent',
            }}>
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* 섹션 레이블 + 정렬 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, paddingTop: tags.length === 0 ? 32 : 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          ls posts/{tag ? ` | grep "#${tag}"` : '/'}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {(['latest', 'views'] as const).map((s) => (
            <Link key={s} href={sortHref(s)} style={{
              fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 8px', borderRadius: 4,
              border: `1px solid ${(sort ?? 'latest') === s ? 'rgba(61,214,140,0.4)' : 'var(--border)'}`,
              color: (sort ?? 'latest') === s ? 'var(--green)' : 'var(--muted)',
              background: (sort ?? 'latest') === s ? 'rgba(61,214,140,0.07)' : 'transparent',
              textDecoration: 'none',
            }}>
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* 포스트 목록 */}
      <div>
        {posts.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, padding: '32px 0' }}>
            no posts found.
          </p>
        )}
        {posts.map((post, i) => (
          <PostListItem key={post.slug} post={post} index={i} views={viewsMap[post.slug] ?? 0} />
        ))}
      </div>
    </div>
  );
}
