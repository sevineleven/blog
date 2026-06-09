import { ImageResponse } from 'next/og';
import { getAllPosts } from '@/lib/posts';
import fs from 'fs';
import path from 'path';

export const alt = 'sevin.dev 블로그 글';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Google Fonts에서 필요한 글자(text)만 서브셋으로 받아 satori에 넘긴다.
// satori 기본 폰트에는 한글 글리프가 없어 이 과정이 없으면 제목이 □로 깨진다.
// 주의: satori는 woff2를 못 읽으므로 truetype/opentype(ttf/otf)만 받아야 한다.
// 모던 UA를 보내면 Google이 woff2를 주므로 UA를 지정하지 않는다.
async function loadGoogleFont(query: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${query}&text=${encodeURIComponent(text)}`;
    const css = await fetch(url).then((r) => r.text());
    const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!src) return null;
    return await fetch(src[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getAllPosts().find((p) => p.slug === slug);

  const title = post?.title ?? slug;
  const tags = (post?.tags ?? []).slice(0, 4);
  const date = (post?.date ?? '').replace(' KST', '');

  // 프로필 사진 — 빌드 시 public/me.png를 data URI로 임베드
  let avatarUri = '';
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'me.png'));
    avatarUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    avatarUri = '';
  }

  // 이미지에 그려질 모든 글자를 모아 서브셋 요청
  const allText =
    title + tags.join('') + slug + date + 'sevin.dev$ cat ~/posts/.md#0123456789: KST';

  const [doHyeon, jetbrains] = await Promise.all([
    loadGoogleFont('Do+Hyeon', allText),
    loadGoogleFont('JetBrains+Mono:wght@500', allText),
  ]);

  const fonts = [
    doHyeon && { name: 'Do Hyeon', data: doHyeon, weight: 400 as const, style: 'normal' as const },
    jetbrains && { name: 'JetBrains Mono', data: jetbrains, weight: 500 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 500; style: 'normal' }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0f0f12',
          padding: 56,
          fontFamily: 'JetBrains Mono',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #272730',
            borderRadius: 18,
            background: '#17171b',
            overflow: 'hidden',
          }}
        >
          {/* 터미널 상단바 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 28px',
              background: '#1e1e26',
              borderBottom: '1px solid #272730',
            }}
          >
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 8, background: '#ff5f57', marginRight: 10 }} />
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 8, background: '#febc2e', marginRight: 10 }} />
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 8, background: '#28c840' }} />
            <div style={{ display: 'flex', marginLeft: 22, color: '#56566a', fontSize: 22 }}>
              ~/posts/{slug}
            </div>
          </div>

          {/* 본문 — 가운데 정렬(카톡 등 중앙 크롭에서도 제목이 살아남게). 프사는 옅은 중앙 배경 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '54px 70px', position: 'relative', overflow: 'hidden' }}>
            {avatarUri ? (
              <img
                width={440}
                height={440}
                src={avatarUri}
                style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -220, marginTop: -220, borderRadius: 220, opacity: 0.28 }}
              />
            ) : null}

            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 24, marginBottom: 22 }}>
              $ cat {slug}.md
            </div>

            <div
              style={{
                display: 'flex',
                textAlign: 'center',
                fontFamily: 'Do Hyeon',
                fontSize: 48,
                lineHeight: 1.32,
                color: '#e0e0e6',
                maxWidth: 880,
                marginBottom: 28,
                wordBreak: 'keep-all',
              }}
            >
              {title}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {tags.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    color: '#b388ff',
                    fontSize: 24,
                    background: 'rgba(179,136,255,0.12)',
                    padding: '6px 16px',
                    borderRadius: 8,
                    margin: '0 6px',
                  }}
                >
                  #{t}
                </div>
              ))}
            </div>
          </div>

          {/* 푸터 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 48px',
              borderTop: '1px solid #272730',
            }}
          >
            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 28 }}>sevin.dev</div>
            <div style={{ display: 'flex', color: '#56566a', fontSize: 22 }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
