'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/lib/posts';

export default function BlogToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px' },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="blog-toc">
      {headings.map(({ id, text, level }) => {
        const isActive = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className={`blog-toc-item${level === 3 ? ' blog-toc-h3' : ''}${isActive ? ' blog-toc-active' : ''}`}
          >
            <span className="blog-toc-dot" style={{ background: isActive ? 'var(--green)' : 'var(--border)' }} />
            <span>{text}</span>
          </a>
        );
      })}
    </nav>
  );
}
