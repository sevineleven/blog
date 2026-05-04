'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PostMeta } from '@/lib/posts';

export default function PostListItem({ post }: { post: PostMeta }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px 0',
          borderBottom: '1px solid var(--border)',
          transition: 'opacity 0.15s',
          opacity: hovered ? 1 : 0.85,
        }}
      >
        {/* 날짜 + 태그 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <time style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            color: 'var(--muted)',
          }}>
            {post.date}
          </time>
          <div style={{ display: 'flex', gap: 6 }}>
            {post.tags.map((t) => (
              <span key={t} style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--purple)',
                background: 'rgba(183,148,244,0.08)',
                padding: '1px 7px',
                borderRadius: 3,
              }}>
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <h2 style={{
          fontSize: 17,
          fontWeight: 600,
          color: hovered ? '#fff' : 'var(--text)',
          letterSpacing: '-0.01em',
          marginBottom: 6,
          transition: 'color 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {hovered && <span style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: 14 }}>▸</span>}
          {post.title}
        </h2>

        {/* excerpt */}
        <p style={{
          fontSize: 13,
          color: 'var(--muted)',
          lineHeight: 1.6,
          paddingLeft: hovered ? 22 : 0,
          transition: 'padding 0.15s',
        }}>
          {post.excerpt}
        </p>
      </div>
    </Link>
  );
}
