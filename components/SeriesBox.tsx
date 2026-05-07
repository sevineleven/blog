import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';

interface SeriesBoxProps {
  series: string;
  posts: PostMeta[];
  currentSlug: string;
}

export default function SeriesBox({ series, posts, currentSlug }: SeriesBoxProps) {
  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '16px 20px',
      marginBottom: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          series
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--progress)', fontWeight: 600 }}>
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14, lineHeight: 1.4 }}>
        {series}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {posts.map((post, i) => {
          const isCurrent = post.slug === currentSlug;
          return (
            <div
              key={post.slug}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 4,
                borderLeft: `2px solid ${isCurrent ? 'var(--progress)' : 'transparent'}`,
                background: isCurrent ? 'var(--subtle)' : 'transparent',
                marginLeft: -8,
              }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0, minWidth: 18 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {isCurrent ? (
                <span style={{ fontSize: 13, color: 'var(--progress)', fontWeight: 500, lineHeight: 1.5 }}>
                  {post.title}
                </span>
              ) : (
                <Link href={`/posts/${post.slug}`} className="series-link" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {post.title}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
