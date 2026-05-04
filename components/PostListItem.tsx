'use client';

import Link from 'next/link';
import { PostMeta } from '@/lib/posts';

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  '프론트엔드': { text: '#5aacf0', bg: 'rgba(90,172,240,0.08)', border: 'rgba(90,172,240,0.2)' },
  '백엔드':    { text: '#3dd68c', bg: 'rgba(61,214,140,0.08)', border: 'rgba(61,214,140,0.2)' },
  '일상':      { text: '#b388ff', bg: 'rgba(179,136,255,0.08)', border: 'rgba(179,136,255,0.2)' },
  '사이드프로젝트': { text: '#f4a23a', bg: 'rgba(244,162,58,0.08)', border: 'rgba(244,162,58,0.2)' },
  '기타':      { text: '#56566a', bg: 'rgba(86,86,106,0.08)',   border: 'rgba(86,86,106,0.2)'  },
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['기타'];
}

export default function PostListItem({ post, index, views = 0 }: { post: PostMeta; index: number; views?: number }) {
  const cc = categoryColor(post.category);
  return (
    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div className="post-item">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* 번호 */}
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--muted)',
            opacity: 0.4,
            paddingTop: 3,
            minWidth: 20,
            textAlign: 'right',
            flexShrink: 0,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 메타 행 */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 7 }}>
              {/* 카테고리 배지 */}
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: cc.text,
                background: cc.bg,
                border: `1px solid ${cc.border}`,
                padding: '1px 8px',
                borderRadius: 4,
                flexShrink: 0,
              }}>
                {post.category}
              </span>

              <time style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                {post.date.slice(0, 10)}
              </time>

              {post.tags.map((t) => (
                <span key={t} style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--purple)',
                  opacity: 0.7,
                }}>
                  #{t}
                </span>
              ))}

              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
                {views > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {views} {views === 1 ? 'view' : 'views'}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                  {post.readTime} min read
                </span>
              </div>
            </div>

            {/* 제목 */}
            <h2 className="post-title">
              <span className="post-arrow">▸</span>
              {post.title}
            </h2>

            {/* 요약 */}
            <p className="post-excerpt">{post.excerpt}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
