import type { Metadata } from 'next';
import './globals.css';
import Shell from '@/components/Shell';
import { getAllPosts } from '@/lib/posts';
import { Analytics } from '@vercel/analytics/next';
import SiteVisitTracker from '@/components/SiteVisitTracker';

export const metadata: Metadata = {
  title: 'sevin.dev | blog',
  description: '배우고 기록하는 개발자의 공간',
  openGraph: {
    title: 'sevin.dev | blog',
    description: '배우고 기록하는 개발자의 공간',
    url: 'https://blog.sevin.dev',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const posts = getAllPosts();
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme')||(document.cookie.match(/(?:^|;\\s*)theme=(dark|light)/)||[])[1];if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();` }} />
      </head>
      <body>
        <Shell posts={posts}>
          {children}
        </Shell>
        <Analytics />
        <SiteVisitTracker />
      </body>
    </html>
  );
}
