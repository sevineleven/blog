'use client';

import { useEffect, useState } from 'react';

// footer 의 © 글자가 글쓴이 모드 토글이다 — 방문자는 모르고, 주인만 ©를 눌러 켠다.
// 켜져 있으면 ©가 초록. 끌 땐 ©를 다시 클릭. 켤 땐 인라인 입력창이 떠서 키를 받는다(브라우저 prompt 안 씀).
// 실제 인증은 서버가 ADMIN_SECRET 과 대조한다. 켜고 끌 때 Comments 에 이벤트로 알린다.
const OWNER_KEY = 'blog_owner_key';
const mono = { fontFamily: 'var(--mono)', fontSize: 11 } as const;

export default function OwnerToggle() {
  const [on, setOn] = useState(false);
  const [entering, setEntering] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try {
      setOn(!!localStorage.getItem(OWNER_KEY));
    } catch {}
  }, []);

  function emit(state: boolean) {
    window.dispatchEvent(new CustomEvent('owner-mode-change', { detail: { on: state } }));
  }

  function clickCopyright() {
    if (on) {
      try { localStorage.removeItem(OWNER_KEY); } catch {}
      setOn(false);
      emit(false);
    } else {
      setDraft('');
      setEntering(true);
    }
  }

  function confirmKey() {
    const key = draft.trim();
    if (!key) { setEntering(false); return; }
    try { localStorage.setItem(OWNER_KEY, key); } catch {}
    setOn(true);
    setEntering(false);
    emit(true);
  }

  if (entering) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          autoFocus
          type="password"
          value={draft}
          placeholder="key"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmKey();
            if (e.key === 'Escape') setEntering(false);
          }}
          style={{
            ...mono,
            width: 120,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            color: 'var(--text)',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(61,214,140,0.4)')}
        />
        <button
          onClick={confirmKey}
          style={{ ...mono, color: 'var(--green)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >→</button>
        <button
          onClick={() => setEntering(false)}
          style={{ ...mono, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >esc</button>
      </span>
    );
  }

  return (
    <span style={{ ...mono, color: 'var(--muted)' }}>
      <span
        onClick={clickCopyright}
        style={{ cursor: 'default', color: on ? 'var(--green)' : 'inherit', userSelect: 'none' }}
      >©</span>{' '}
      {new Date().getFullYear()} sevineleven
    </span>
  );
}
