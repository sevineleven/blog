'use client';

import { useState } from 'react';
import { PostMeta } from '@/lib/posts';
import Navbar from './Navbar';
import SearchModal from './SearchModal';
import Footer from './Footer';

const CONTAINER = {
  maxWidth: 680,
  margin: '0 auto',
  padding: '0 28px',
} as const;

export default function Shell({ children, posts }: { children: React.ReactNode; posts: PostMeta[] }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* 네브바: 뷰포트 전체 너비, 컨테이너 밖 */}
      <Navbar onSearchOpen={() => setSearchOpen(true)} containerStyle={CONTAINER} />

      {/* 콘텐츠 영역 */}
      <div style={{ ...CONTAINER, paddingTop: 48, paddingBottom: 80 }}>
        <main>{children}</main>
        <Footer />
      </div>

      <SearchModal posts={posts} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
