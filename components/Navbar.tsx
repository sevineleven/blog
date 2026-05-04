'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const NAV = [
  { label: '$ cd ~',         href: 'https://sevin.dev', external: true },
  { label: '$ cd ~/blog',    href: '/' },
  { label: '$ cd ~/universe',href: '/universe' },
];

export default function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
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
      background: 'rgba(15,15,18,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      marginLeft: -24,
      marginRight: -24,
      padding: '0 24px',
    }}>
      {/* 경로 표시줄 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.01em' }}>
          <span style={{ color: 'var(--green)' }}>sevineleven</span>
          <span>@dev</span>
          <span style={{ color: 'var(--border)', margin: '0 6px' }}>:</span>
          <span style={{ color: 'var(--blue)' }}>{getPath()}</span>
        </span>

        <button className="search-btn" onClick={onSearchOpen}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          search
          <kbd>⌘K</kbd>
        </button>
      </div>

      {/* 네비게이션 링크 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 40 }}>
        {NAV.map((item) => {
          const isActive = !item.external && (
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          );
          const cls = `nav-link${isActive ? ' active' : ''}`;
          return item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="nav-link">
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className={cls}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
