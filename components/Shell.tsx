'use client';

import { useState } from 'react';
import { PostMeta } from '@/lib/posts';
import Navbar from './Navbar';
import SearchModal from './SearchModal';
import Footer from './Footer';
import Sidebar from './Sidebar';

const NAV_CONTAINER = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '0 28px',
} as const;

export default function Shell({ children, posts, initialStats }: { children: React.ReactNode; posts: PostMeta[]; initialStats?: { today: number; total: number } }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Navbar onSearchOpen={() => setSearchOpen(true)} containerStyle={NAV_CONTAINER} />

      <div className="blog-layout">
        <div className="blog-sidebar-col">
          <Sidebar initialStats={initialStats} />
        </div>
        <main className="blog-main">
          {children}
          <Footer />
        </main>
      </div>

      <SearchModal posts={posts} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
