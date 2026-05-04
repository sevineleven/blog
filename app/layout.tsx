import type { Metadata } from 'next';
import './globals.css';
import Shell from '@/components/Shell';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'sevin.dev',
  description: '배우고 기록하는 개발자의 공간',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const posts = getAllPosts();

  return (
    <html lang="ko">
      <body>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <Shell posts={posts}>
            {children}
          </Shell>
        </div>
      </body>
    </html>
  );
}
