'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const SITE = 'https://blog.sevin.dev';
// Kakao JavaScript 키는 클라이언트 공개용(도메인 화이트리스트로 보호)이라 fallback 상수로 둬도 안전.
// blog.sevin.dev 외 도메인에선 카카오가 거부함. 환경변수가 있으면 그게 우선.
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_KEY ?? 'bc84d10971bb3bf6f15bac01449a2baf';

declare global {
  interface Window {
    // Kakao JS SDK (런타임 주입)
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: { sendDefault: (opts: unknown) => void };
    };
  }
}

interface Props {
  url: string;       // 전체 URL (https://blog.sevin.dev/posts/slug)
  title: string;
  excerpt: string;
  slug: string;
}

function ActionRow({
  label,
  hint,
  icon,
  onClick,
  href,
}: {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const [hover, setHover] = useState(false);
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid transparent',
    background: hover ? 'var(--subtle)' : 'transparent',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.12s',
    textAlign: 'left',
  };
  const inner = (
    <>
      <span style={{ display: 'flex', width: 20, color: 'var(--muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {hint ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>{hint}</span> : null}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={style}
       onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {inner}
    </a>
  ) : (
    <button type="button" style={style} onClick={onClick}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {inner}
    </button>
  );
}

export default function ShareSheet({ url, title, excerpt, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  const ogUrl = `${SITE}/posts/${slug}/opengraph-image`;
  const storyUrl = `/posts/${slug}/story-image`;

  useEffect(() => setMounted(true), []);

  // Kakao SDK 로드 + 초기화 (키가 있을 때만)
  useEffect(() => {
    if (!open || !KAKAO_KEY) return;
    const init = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
    };
    if (window.Kakao) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    // 주의: SRI integrity는 공식 검증값을 확인한 뒤 추가할 것 (틀린 해시는 로드를 막음)
    s.crossOrigin = 'anonymous';
    s.onload = init;
    document.head.appendChild(s);
  }, [open]);

  // body 스크롤 잠금 + Esc 닫기
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareKakao = () => {
    if (!window.Kakao?.isInitialized()) return;
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: excerpt,
        imageUrl: ogUrl,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '글 보러가기', link: { mobileWebUrl: url, webUrl: url } }],
    });
  };

  // 인스타 스토리: 9:16 이미지를 파일로 공유 시트에 첨부(모바일) → 인스타 선택 → 스토리.
  // 웹에서 스토리 자동 게시는 불가하므로 여기까지가 한계. 데스크톱은 이미지를 새 탭으로 연다.
  const shareInstagramStory = async () => {
    try {
      const res = await fetch(storyUrl);
      const blob = await res.blob();
      const file = new File([blob], `${slug}-story.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d?: { files?: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title } as ShareData);
        return;
      }
    } catch {}
    window.open(storyUrl, '_blank');
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="이 글 공유하기"
      title="이 글 공유하기"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)',
        background: 'transparent', border: '1px solid transparent', borderRadius: 6,
        padding: '3px 9px', cursor: 'pointer', lineHeight: 1, transition: 'color 0.15s, border-color 0.15s', flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      share
    </button>
  );

  const modal = open && mounted ? createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="공유하기"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
          padding: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)' }}>
            <span style={{ color: 'var(--green)' }}>$</span> share
          </span>
          <button type="button" onClick={() => setOpen(false)} aria-label="닫기"
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}>
            ✕
          </button>
        </div>

        {/* 카드 미리보기 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/posts/${slug}/opengraph-image`}
          alt="공유 카드 미리보기"
          width={1200} height={630}
          style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16, display: 'block' }}
        />

        {/* 액션들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ActionRow
            label={copied ? '링크 복사됨!' : '링크 복사'}
            onClick={copyLink}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
          />

          {KAKAO_KEY ? (
            <ActionRow
              label="카카오톡"
              onClick={shareKakao}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.6 2 11c0 2.9 1.9 5.4 4.7 6.8-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.7-2.5.6.1 1.3.1 2 .1 5.5 0 10-3.6 10-8s-4.5-8-10-8z" />
                </svg>
              }
            />
          ) : null}

          <ActionRow
            label="인스타 스토리"
            hint="9:16"
            onClick={shareInstagramStory}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            }
          />
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
