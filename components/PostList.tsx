'use client';

import { useCallback, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/posts';
import PostListItem from './PostListItem';

const PER_PAGE = 10;

export default function PostList({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag  = searchParams.get('tag')  ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const navigate = useCallback((newTag?: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newTag) params.set('tag', newTag);
    if (newPage && newPage > 1) params.set('page', String(newPage));
    const q = params.toString();
    router.push(q ? `/?${q}` : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router]);

  const seriesMap = new Map<string, PostMeta[]>();
  posts.forEach((p) => {
    if (p.series) {
      if (!seriesMap.has(p.series)) seriesMap.set(p.series, []);
      seriesMap.get(p.series)!.push(p);
    }
  });
  seriesMap.forEach((sp, key) => seriesMap.set(key, [...sp].sort((a, b) => a.date < b.date ? -1 : 1)));

  const filtered   = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 태그를 사용 빈도(글 수) 순으로 정렬 — 자주 쓰는 주제가 앞에 오고, 동률이면 가나다/알파벳순.
  const tagCount = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)));
  const orderedTags = [...tags].sort(
    (a, b) => (tagCount.get(b) ?? 0) - (tagCount.get(a) ?? 0) || a.localeCompare(b),
  );
  const TOP_TAGS = 10;
  const [showAllTags, setShowAllTags] = useState(false);
  let visibleTags = showAllTags ? orderedTags : orderedTags.slice(0, TOP_TAGS);
  // 선택된 태그가 접힌 영역에 있으면 항상 보이게 한다.
  if (tag && !visibleTags.includes(tag)) visibleTags = [tag, ...visibleTags];

  return (
    <>
      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '28px 0' }}>
          <button
            onClick={() => navigate(undefined, 1)}
            style={{
              fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 12px', borderRadius: 5,
              border: `1px solid ${!tag ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
              color: !tag ? 'var(--green)' : 'var(--text)',
              background: !tag ? 'rgba(61,214,140,0.07)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            all
          </button>
          {visibleTags.map((t) => (
            <button
              key={t}
              onClick={() => navigate(t, 1)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 12px', borderRadius: 5,
                border: `1px solid ${tag === t ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
                color: tag === t ? 'var(--green)' : 'var(--text)',
                background: tag === t ? 'rgba(61,214,140,0.07)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              #{t}
            </button>
          ))}
          {orderedTags.length > TOP_TAGS && (
            <button
              onClick={() => setShowAllTags((v) => !v)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 12px', borderRadius: 5,
                border: '1px solid var(--border)', color: 'var(--muted)',
                background: 'transparent', cursor: 'pointer',
              }}
            >
              {showAllTags ? '접기' : `+${orderedTags.length - TOP_TAGS} 더보기`}
            </button>
          )}
        </div>
      )}

      {/* 섹션 레이블 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, paddingTop: tags.length === 0 ? 32 : 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
          ls posts/{tag ? ` | grep "#${tag}"` : '/'}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* 포스트 목록 */}
      <div>
        {paginated.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, padding: '32px 0' }}>
            no posts found.
          </p>
        )}
        {paginated.map((post, i) => {
          const sp = post.series ? seriesMap.get(post.series) : undefined;
          const seriesInfo = sp ? { index: sp.findIndex((p) => p.slug === post.slug) + 1, total: sp.length } : undefined;
          return <PostListItem key={post.slug} post={post} index={(page - 1) * PER_PAGE + i} seriesInfo={seriesInfo} />;
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 48, paddingBottom: 8 }}>
          <button
            onClick={() => navigate(tag, page - 1)}
            disabled={page === 1}
            style={{
              fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', borderRadius: 5,
              border: '1px solid var(--border)',
              color: page === 1 ? 'var(--muted)' : 'var(--text)',
              background: 'transparent',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            ← prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => navigate(tag, p)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', borderRadius: 5,
                border: `1px solid ${p === page ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
                color: p === page ? 'var(--green)' : 'var(--muted)',
                background: p === page ? 'rgba(61,214,140,0.07)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => navigate(tag, page + 1)}
            disabled={page === totalPages}
            style={{
              fontFamily: 'var(--mono)', fontSize: 12, padding: '4px 10px', borderRadius: 5,
              border: '1px solid var(--border)',
              color: page === totalPages ? 'var(--muted)' : 'var(--text)',
              background: 'transparent',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            next →
          </button>
        </div>
      )}
    </>
  );
}
