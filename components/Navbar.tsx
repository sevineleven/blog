'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const FIXED_NAV = [
  { cmd: 'cd', path: '~/blog',     href: '/' },
  { cmd: 'cd', path: '~/universe', href: '/universe' },
];

function getParent(pathname: string): { cmd: string; path: string; href: string; external: boolean } {
  if (pathname === '/') {
    return { cmd: 'cd', path: '..', href: 'https://sevin.dev', external: true };
  }
  return { cmd: 'cd', path: '..', href: '/', external: false };
}

function ZshCmd({ cmd, path, isActive }: { cmd: string; path: string; isActive: boolean }) {
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 0 }}>
      <span style={{ color: isActive ? 'var(--green)' : 'var(--muted)' }}>$&nbsp;</span>
      {/* 유효한 명령어 → white, active → green */}
      <span style={{ color: isActive ? 'var(--green)' : 'var(--text)' }}>{cmd}</span>
      <span>&nbsp;</span>
      {/* 경로 → blue */}
      <span style={{ color: isActive ? 'var(--green)' : 'var(--blue)' }}>{path}</span>
    </span>
  );
}

interface NavbarProps {
  onSearchOpen: () => void;
  containerStyle: { maxWidth: number; margin: string; padding: string };
}

export default function Navbar({ onSearchOpen, containerStyle }: NavbarProps) {
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchOpen]);

  const getPath = () => {
    if (pathname === '/') return '~/blog';
    if (pathname === '/universe') return '~/blog/universe';
    if (pathname.startsWith('/posts/')) return `~/blog/${pathname.split('/posts/')[1]}`;
    return '~/blog';
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      background: 'rgba(15,15,18,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column' }}>

        {/* 상단: 경로 브레드크럼 + 검색 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
            <span style={{ color: 'var(--green)' }}>sevineleven</span>
            <span style={{ color: 'var(--muted)' }}>@dev</span>
            <span style={{ color: 'var(--muted)', margin: '0 6px' }}>:</span>
            <span style={{ color: 'var(--blue)' }}>{getPath()}</span>
          </span>

          <button className="search-btn" onClick={onSearchOpen}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            search
            <kbd>⌘K</kbd>
          </button>
        </div>

        {/* 하단: 네비 링크 (zsh 색상) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44 }}>
          {/* 동적 cd .. */}
          {(() => {
            const parent = getParent(pathname);
            const content = <ZshCmd cmd={parent.cmd} path={parent.path} isActive={false} />;
            return parent.external ? (
              <a href={parent.href} target="_blank" rel="noopener noreferrer" className="nav-link">
                {content}
              </a>
            ) : (
              <Link href={parent.href} className="nav-link">
                {content}
              </Link>
            );
          })()}

          {/* 구분선 */}
          <span style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />

          {/* 고정 nav */}
          {FIXED_NAV.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                <ZshCmd cmd={item.cmd} path={item.path} isActive={isActive} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
