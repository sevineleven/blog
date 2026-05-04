'use client';

import Link from 'next/link';
import { PostMeta } from '@/lib/posts';

export default function PostListItem({ post }: { post: PostMeta }) {
  return (
    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div className="post-item">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <time style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            {post.date}
          </time>
          {post.tags.map((t) => (
            <span key={t} style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--purple)',
              background: 'rgba(179,136,255,0.08)',
              padding: '1px 7px',
              borderRadius: 3,
              border: '1px solid rgba(179,136,255,0.15)',
            }}>
              #{t}
            </span>
          ))}
        </div>

        <h2 className="post-title">
          <span className="post-arrow">▸</span>
          {post.title}
        </h2>

        <p className="post-excerpt">{post.excerpt}</p>
      </div>
    </Link>
  );
}
