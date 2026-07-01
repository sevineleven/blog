'use client';

import { useEffect, useState } from 'react';

// 글 헤더 메타 줄에 조회수를 표시한다. 글 페이지는 정적(SSG)이라 서버에서 구우면
// 값이 빌드 시점에 고정되므로, LikeButton 과 동일하게 클라에서 라이브로 가져온다.
export default function ViewCount({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/views')
      .then((r) => r.json())
      .then((map: Record<string, number>) => setCount(map[slug] ?? 0))
      .catch(() => {});
  }, [slug]);

  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
      {' · 조회 '}
      {count === null ? '—' : count.toLocaleString()}
    </span>
  );
}
