'use client';

import { useEffect, useState } from 'react';

// footer 의 © 글자 자체가 글쓴이 모드 토글이다 — 방문자는 모르고, 주인만 ©를 눌러 켠다.
// 켜져 있으면 ©가 초록으로 표시(주인만 알아챌 정도의 신호). 비밀키는 localStorage 에 저장되고,
// 실제 글쓴이 인증은 서버가 ADMIN_SECRET 과 대조한다. 켜고 끌 때 Comments 에 이벤트로 알린다.
const OWNER_KEY = 'blog_owner_key';

export default function OwnerToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      setOn(!!localStorage.getItem(OWNER_KEY));
    } catch {}
  }, []);

  function toggle() {
    try {
      if (localStorage.getItem(OWNER_KEY)) {
        localStorage.removeItem(OWNER_KEY);
        setOn(false);
        window.dispatchEvent(new CustomEvent('owner-mode-change', { detail: { on: false } }));
      } else {
        const key = window.prompt('owner key');
        if (!key) return;
        localStorage.setItem(OWNER_KEY, key);
        setOn(true);
        window.dispatchEvent(new CustomEvent('owner-mode-change', { detail: { on: true } }));
      }
    } catch {}
  }

  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
      <span
        onClick={toggle}
        style={{ cursor: 'default', color: on ? 'var(--green)' : 'inherit', userSelect: 'none' }}
      >©</span>{' '}
      {new Date().getFullYear()} sevineleven
    </span>
  );
}
