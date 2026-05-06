'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/posts';
import PostListItem from './PostListItem';

export default function PostList({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get('tag') ?? undefined;

  const setTag = useCallback((newTag?: string) => {
    const q = newTag ? `?tag=${newTag}` : '';
    router.push(q ? `/${q}` : '/');
  }, [router]);

  const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  return (
    <>
      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '28px 0' }}>
          <button
            onClick={() => setTag(undefined)}
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
              onClick={() => setTag(t)}
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
        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, padding: '32px 0' }}>
            no posts found.
          </p>
        )}
        {filtered.map((post, i) => (
          <PostListItem key={post.slug} post={post} index={i} />
        ))}
      </div>
    </>
  );
}
