import { Suspense } from 'react';
import Image from 'next/image';
import { getAllPosts, getAllTags } from '@/lib/posts';
import PostList from '@/components/PostList';

export const dynamic = 'force-static';

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div>
      {/* whoami - 모바일 전용 (데스크탑은 사이드바) */}
      <header className="whoami-mobile" style={{ paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>whoami</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <Image src="/me.png" alt="박세빈" width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <span style={{ color: 'var(--blue)', marginRight: 12 }}>name</span>
              <span style={{ color: 'var(--text)' }}>parksevin</span>
            </div>
            <div>
              <span style={{ color: 'var(--blue)', marginRight: 16 }}>role</span>
              <span style={{ color: 'var(--text)' }}>backend engineer</span>
            </div>
            <div>
              <span style={{ color: 'var(--blue)', marginRight: 8 }}>writing</span>
              <span style={{ color: 'var(--text)' }}>배우면서 기록하기</span>
            </div>
            <div>
              <span style={{ color: 'var(--blue)', marginRight: 4 }}>github</span>
              <a href="https://github.com/sevineleven" target="_blank" rel="noopener noreferrer" className="whoami-link">
                github.com/sevineleven
              </a>
            </div>
          </div>
        </div>
      </header>

      <Suspense>
        <PostList posts={posts} tags={tags} />
      </Suspense>
    </div>
  );
}
