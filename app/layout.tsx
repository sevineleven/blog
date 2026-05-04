import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'sevin.dev',
  description: '배우고 기록하는 개발자의 공간',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
