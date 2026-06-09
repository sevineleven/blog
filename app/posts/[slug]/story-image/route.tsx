// 인스타 스토리용 9:16 이미지 (1080×1920) — OG 카드를 세로 캔버스 가운데에 얹는다.
import { ImageResponse } from 'next/og';
import { getAllPosts } from '@/lib/posts';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

async function loadGoogleFont(query: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&text=${encodeURIComponent(text)}`).then((r) => r.text());
    const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!src) return null;
    return await fetch(src[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getAllPosts().find((p) => p.slug === slug);

  const title = post?.title ?? slug;
  const tags = (post?.tags ?? []).slice(0, 4);
  const date = (post?.date ?? '').replace(' KST', '');

  let avatarUri = '';
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'me.png'));
    avatarUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {}

  const allText = title + tags.join('') + slug + date + 'sevin.dev$ cat ~/posts/.md#0123456789: KST읽어보기 프로필 링크에서';
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
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0f0f12',
          padding: '120px 60px',
          fontFamily: 'JetBrains Mono',
        }}
      >
        {/* 상단 브랜딩 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {avatarUri ? <img width={64} height={64} src={avatarUri} style={{ borderRadius: 32, marginRight: 18, border: '2px solid #272730' }} /> : null}
          <div style={{ display: 'flex', color: '#3dd68c', fontSize: 38 }}>sevin.dev</div>
        </div>

        {/* 가운데: OG 카드 그대로 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 960,
            border: '1px solid #272730',
            borderRadius: 22,
            background: '#17171b',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '24px 30px', background: '#1e1e26', borderBottom: '1px solid #272730' }}>
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#ff5f57', marginRight: 11 }} />
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#febc2e', marginRight: 11 }} />
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#28c840' }} />
            <div style={{ display: 'flex', marginLeft: 22, color: '#56566a', fontSize: 24 }}>~/posts/{slug}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: 52, position: 'relative', overflow: 'hidden' }}>
            {avatarUri ? (
              <img width={520} height={520} src={avatarUri} style={{ position: 'absolute', right: -110, top: -30, borderRadius: 260, opacity: 0.3 }} />
            ) : null}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, #17171b 34%, rgba(23,23,27,0) 92%)' }} />

            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 30, marginBottom: 28 }}>$ cat {slug}.md</div>
            <div style={{ display: 'flex', fontFamily: 'Do Hyeon', fontSize: 56, lineHeight: 1.3, color: '#e0e0e6', width: '74%', marginBottom: 38, wordBreak: 'keep-all' }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {tags.map((t) => (
                <div key={t} style={{ display: 'flex', color: '#b388ff', fontSize: 28, background: 'rgba(179,136,255,0.12)', padding: '8px 20px', borderRadius: 10, marginRight: 14, marginBottom: 10 }}>#{t}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 52px', borderTop: '1px solid #272730' }}>
            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 32 }}>sevin.dev</div>
            <div style={{ display: 'flex', color: '#56566a', fontSize: 26 }}>{date}</div>
          </div>
        </div>

        {/* 하단 CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: 'Do Hyeon', color: '#e0e0e6', fontSize: 40, marginBottom: 14 }}>읽어보기</div>
          <div style={{ display: 'flex', color: '#56566a', fontSize: 28 }}>blog.sevin.dev/posts/{slug}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}
