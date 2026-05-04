'use client';

import { useState } from 'react';
import { PostMeta } from '@/lib/posts';
import Navbar from './Navbar';
import SearchModal from './SearchModal';
import Footer from './Footer';

export default function Shell({ children, posts }: { children: React.ReactNode; posts: PostMeta[] }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <main>{children}</main>
      <Footer />
      <SearchModal posts={posts} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
