import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'sevin.dev',
  description: '배우고 기록하는 개발자의 공간',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 860,
          margin: '40px auto',
          padding: '0 16px 60px',
        }}>
          {/* macOS 터미널 창 프레임 */}
          <div style={{
            background: '#323232',
            borderRadius: '12px 12px 0 0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid #444',
            userSelect: 'none',
          }}>
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
            <span style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              color: '#888',
              letterSpacing: '0.02em',
            }}>
              sevin@blog: ~/posts
            </span>
          </div>

          {/* 터미널 본문 */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            flex: 1,
            padding: '32px 36px',
          }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
