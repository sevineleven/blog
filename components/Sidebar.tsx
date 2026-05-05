'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const [stats, setStats] = useState<{ today: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/site-visits')
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* whoami */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>whoami</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Image
            src="/me.png"
            alt="박세빈"
            width={84}
            height={84}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
          />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--blue)', flexShrink: 0 }}>name</span>
              <span>parksevin</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--blue)', flexShrink: 0 }}>role</span>
              <span>backend engineer</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--blue)', flexShrink: 0 }}>writing</span>
              <span>배우면서 기록하기</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--blue)', flexShrink: 0 }}>github</span>
              <a
                href="https://github.com/sevineleven"
                target="_blank"
                rel="noopener noreferrer"
                className="whoami-link"
                style={{ fontSize: 12 }}
              >
                sevineleven
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* 방문자 stats */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>$</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>uptime</span>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--blue)' }}>today</span>
            <span style={{ color: 'var(--text)' }}>
              {stats ? stats.today.toLocaleString() : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--blue)' }}>total</span>
            <span style={{ color: 'var(--text)' }}>
              {stats ? stats.total.toLocaleString() : '—'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
