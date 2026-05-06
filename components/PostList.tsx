'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/posts';
import PostListItem from './PostListItem';

export default function PostList({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get('tag') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/views')
      .then((r) => r.json())
      .then((data) => setViewsMap(data))
      .catch(() => {});
  }, []);

  const setParams = useCallback((newTag?: string, newSort?: string) => {
    const params = new URLSearchParams();
    if (newTag) params.set('tag', newTag);
    if (newSort && newSort !== 'latest') params.set('sort', newSort);
    const q = params.toString();
    router.push(q ? `/?${q}` : '/');
  }, [router]);

  let filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  if (sort === 'views') {
    filtered = [...filtered].sort((a, b) => (viewsMap[b.slug] ?? 0) - (viewsMap[a.slug] ?? 0));
  }

  return (
    <>
      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '28px 0' }}>
          <button
            onClick={() => setParams(undefined, sort)}
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
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setParams(t, sort)}
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
            <button
              key={s}
              onClick={() => setParams(tag, s)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 8px', borderRadius: 4,
                border: `1px solid ${(sort ?? 'latest') === s ? 'rgba(61,214,140,0.4)' : 'var(--border)'}`,
                color: (sort ?? 'latest') === s ? 'var(--green)' : 'var(--muted)',
                background: (sort ?? 'latest') === s ? 'rgba(61,214,140,0.07)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 포스트 목록 */}
      <div>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, padding: '32px 0' }}>
            no posts found.
          </p>
        )}
        {filtered.map((post, i) => (
          <PostListItem key={post.slug} post={post} index={i} views={viewsMap[post.slug] ?? 0} />
        ))}
      </div>
    </>
  );
}
