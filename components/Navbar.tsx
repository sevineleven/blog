'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface NavbarProps {
  onSearchOpen: () => void;
}

export default function Navbar({ onSearchOpen }: NavbarProps) {
  const pathname = usePathname();

  // ⌘K / Ctrl+K 단축키
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

  const navItems = [
    { label: '$ cd ~', href: 'https://sevin.dev', external: true },
    { label: '$ cd ~/blog', href: '/' },
    { label: '$ cd ~/universe', href: '/universe' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(17, 17, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      marginLeft: -24,
      marginRight: -24,
      padding: '0 24px',
    }}>
      {/* 상단: 경로 + 검색 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0 6px',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
          <span style={{ color: 'var(--green)' }}>sevin</span>
          <span style={{ color: 'var(--muted)' }}>@blog</span>
          <span style={{ color: 'var(--muted)' }}> : </span>
          <span style={{ color: 'var(--blue)' }}>{getPath()}</span>
        </div>
        <button
          onClick={onSearchOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--muted)',
            background: 'var(--subtle)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '3px 10px',
            cursor: 'pointer',
          }}
        >
          search
          <kbd style={{
            fontSize: 10,
            background: 'var(--border)',
            borderRadius: 3,
            padding: '1px 5px',
            color: 'var(--muted)',
          }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 하단: 네비게이션 */}
      <div style={{ display: 'flex', gap: 4, paddingBottom: 8 }}>
        {navItems.map((item) => {
          const isActive = !item.external && (
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          );
          return item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--muted)',
                textDecoration: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: isActive ? 'var(--green)' : 'var(--muted)',
                textDecoration: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                background: isActive ? 'rgba(61,214,140,0.08)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
