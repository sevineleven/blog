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

export default function Shell({ children, posts }: { children: React.ReactNode; posts: PostMeta[] }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Navbar onSearchOpen={() => setSearchOpen(true)} containerStyle={NAV_CONTAINER} />

      <div className="blog-layout">
        <main className="blog-main">
          {children}
          <Footer />
        </main>
        <div className="blog-sidebar-col">
          <Sidebar />
        </div>
      </div>

      <SearchModal posts={posts} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
