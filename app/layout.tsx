import type { Metadata } from 'next';
import { JetBrains_Mono, Do_Hyeon } from 'next/font/google';
import './globals.css';
import Shell from '@/components/Shell';
import { getAllPosts } from '@/lib/posts';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SiteVisitTracker from '@/components/SiteVisitTracker';
import { supabase } from '@/lib/supabase';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const doHyeon = Do_Hyeon({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-round',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://blog.sevin.dev'),
  title: '개발자 세빈',
  description: '배우고 기록하는 개발자의 공간',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '개발자 세빈',
    description: '배우고 기록하는 개발자의 공간',
    url: 'https://blog.sevin.dev',
  },
};

async function getInitialStats() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('site_visits').select('date, count');
    const todayCount = data?.find((r) => r.date === today)?.count ?? 0;
    const total = data?.reduce((sum, r) => sum + r.count, 0) ?? 0;
    return { today: todayCount, total };
  } catch {
    return undefined;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const posts = getAllPosts();
  const initialStats = await getInitialStats();
  return (
    <html lang="ko" className={`${jetbrainsMono.variable} ${doHyeon.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme')||(document.cookie.match(/(?:^|;\\s*)theme=(dark|light)/)||[])[1];if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();` }} />
      </head>
      <body>
        <Shell posts={posts} initialStats={initialStats}>
          {children}
        </Shell>
        <Analytics />
        <SpeedInsights />
        <SiteVisitTracker />
      </body>
    </html>
  );
}
