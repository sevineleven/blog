'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface NavbarProps {
  onSearchOpen: () => void;
}

const NAV = [
  { label: '~', href: 'https://sevin.dev', external: true, title: 'portfolio' },
  { label: 'blog', href: '/' },
  { label: 'universe', href: '/universe' },
];

export default function Navbar({ onSearchOpen }: NavbarProps) {
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
    if (pathname === '/') return '/';
    if (pathname === '/universe') return '/universe';
    if (pathname.startsWith('/posts/')) return `/posts/${pathname.split('/posts/')[1]}`;
    return '/';
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(17,17,20,0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border)',
      marginLeft: -24,
      marginRight: -24,
      padding: '0 24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        gap: 16,
      }}>
        {/* 왼쪽: 경로 브레드크럼 */}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <span style={{ color: 'var(--green)', flexShrink: 0 }}>sevineleven</span>
          <span style={{ flexShrink: 0 }}>&nbsp;:&nbsp;</span>
          <span style={{
            color: 'var(--blue)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {getPath()}
          </span>
        </div>

        {/* 오른쪽: 네비 + 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {NAV.map((item, i) => {
            const isActive = !item.external && (
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            );
            const linkStyle = {
              fontFamily: 'var(--mono)',
              fontSize: 13,
              textDecoration: 'none',
              padding: '5px 10px',
              borderRadius: 6,
              transition: 'all 0.15s',
              color: isActive ? 'var(--green)' : 'var(--muted)',
              background: isActive ? 'rgba(61,214,140,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(61,214,140,0.2)' : '1px solid transparent',
              display: 'inline-block',
            } as React.CSSProperties;

            return (
              <span key={item.href} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span style={{ color: 'var(--border)', fontSize: 14, padding: '0 2px', userSelect: 'none' }}>
                    /
                  </span>
                )}
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} style={linkStyle}>
                    {item.label}
                  </Link>
                )}
              </span>
            );
          })}

          {/* 구분선 */}
          <span style={{
            width: 1,
            height: 16,
            background: 'var(--border)',
            margin: '0 8px',
            display: 'inline-block',
          }} />

          {/* 검색 버튼 */}
          <button
            onClick={onSearchOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--green)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--muted)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            search
            <kbd style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              background: 'var(--subtle)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '1px 5px',
              color: 'var(--muted)',
              lineHeight: 1.6,
            }}>
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </nav>
  );
}
