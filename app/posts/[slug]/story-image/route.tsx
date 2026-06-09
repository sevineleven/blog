// 인스타 스토리용 9:16 이미지 (1080×1920)
// "피드를 스토리에 공유"하는 느낌: 어둡게 깐 내 사진 배경 + 가운데에 OG 카드(피드 모양).
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

  // 흐릿한 배경용 — me.png를 미리 블러 처리한 정적 이미지(sharp로 생성)
  let blurUri = '';
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'me-blur.png'));
    blurUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch {}

  const allText = title + tags.join('') + slug + date + 'sevin.dev$ cat ~/posts/.md#0123456789: KST읽어보기';
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
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#0f0f12', fontFamily: 'JetBrains Mono' }}>
        {/* 배경: 미리 블러 처리한 내 사진을 가득 채우고, 그 위를 옅게 덮어 카드가 떠 보이게 */}
        {blurUri ? (
          <img width={1920} height={1920} src={blurUri} style={{ position: 'absolute', left: -420, top: 0 }} />
        ) : null}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(15,15,18,0.5) 0%, rgba(15,15,18,0.68) 50%, rgba(15,15,18,0.88) 100%)' }} />

        {/* 콘텐츠 */}
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '130px 60px' }}>
          {/* 상단 프로필 칩 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {avatarUri ? <img width={66} height={66} src={avatarUri} style={{ borderRadius: 33, marginRight: 18, border: '2px solid rgba(255,255,255,0.15)' }} /> : null}
            <div style={{ display: 'flex', color: '#e0e0e6', fontSize: 40 }}>sevin.dev</div>
          </div>

          {/* 가운데: OG 카드(피드 모양) */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 920, border: '1px solid #272730', borderRadius: 24, background: '#17171b', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '24px 30px', background: '#1e1e26', borderBottom: '1px solid #272730' }}>
              <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#ff5f57', marginRight: 11 }} />
              <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#febc2e', marginRight: 11 }} />
              <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#28c840' }} />
              <div style={{ display: 'flex', marginLeft: 22, color: '#56566a', fontSize: 24 }}>~/posts/{slug}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: 50, position: 'relative', overflow: 'hidden' }}>
              {avatarUri ? <img width={300} height={300} src={avatarUri} style={{ position: 'absolute', right: 24, top: 52, borderRadius: 150, opacity: 0.26 }} /> : null}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, #17171b 34%, rgba(23,23,27,0) 92%)' }} />
              <div style={{ display: 'flex', color: '#3dd68c', fontSize: 30, marginBottom: 28 }}>$ cat {slug}.md</div>
              <div style={{ display: 'flex', fontFamily: 'Do Hyeon', fontSize: 52, lineHeight: 1.3, color: '#e0e0e6', width: '74%', marginBottom: 36, wordBreak: 'keep-all' }}>{title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <div key={t} style={{ display: 'flex', color: '#b388ff', fontSize: 28, background: 'rgba(179,136,255,0.12)', padding: '8px 20px', borderRadius: 10, marginRight: 14, marginBottom: 10 }}>#{t}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 50px', borderTop: '1px solid #272730' }}>
              <div style={{ display: 'flex', color: '#3dd68c', fontSize: 32 }}>sevin.dev</div>
              <div style={{ display: 'flex', color: '#56566a', fontSize: 26 }}>{date}</div>
            </div>
          </div>

          {/* 하단 CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontFamily: 'Do Hyeon', color: '#ffffff', fontSize: 44, marginBottom: 16 }}>읽어보기</div>
            <div style={{ display: 'flex', color: '#9a9aa8', fontSize: 28 }}>blog.sevin.dev/posts/{slug}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );
}
