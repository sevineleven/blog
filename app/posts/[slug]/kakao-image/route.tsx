// 카카오톡 공유 전용 이미지 (1080×1080 정사각)
// 카톡은 넓은 이미지의 좌우를 잘라서, 정사각으로 주면 위아래만 잘리고 가로(카드)는 온전히 보인다.
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

  const allText = title + tags.join('') + slug + date + 'sevin.dev$ cat ~/posts/.md#0123456789: KST';
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
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f0f12', padding: 60, fontFamily: 'JetBrains Mono' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 960, border: '1px solid #272730', borderRadius: 22, background: '#17171b', overflow: 'hidden' }}>
          {/* 상단바 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '24px 30px', background: '#1e1e26', borderBottom: '1px solid #272730' }}>
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#ff5f57', marginRight: 11 }} />
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#febc2e', marginRight: 11 }} />
            <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 9, background: '#28c840' }} />
            <div style={{ display: 'flex', marginLeft: 22, color: '#56566a', fontSize: 24 }}>~/posts/{slug}</div>
          </div>

          {/* 본문 — 가운데 정렬, 프사는 옅은 중앙 배경 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 56px', position: 'relative', overflow: 'hidden' }}>
            {avatarUri ? (
              <img width={420} height={420} src={avatarUri} style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -210, marginTop: -210, borderRadius: 210, opacity: 0.1 }} />
            ) : null}
            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 28, marginBottom: 26 }}>$ cat {slug}.md</div>
            <div style={{ display: 'flex', textAlign: 'center', fontFamily: 'Do Hyeon', fontSize: 52, lineHeight: 1.34, color: '#e0e0e6', maxWidth: 800, marginBottom: 32, wordBreak: 'keep-all' }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {tags.map((t) => (
                <div key={t} style={{ display: 'flex', color: '#b388ff', fontSize: 26, background: 'rgba(179,136,255,0.12)', padding: '7px 18px', borderRadius: 9, margin: '0 7px' }}>#{t}</div>
              ))}
            </div>
          </div>

          {/* 푸터 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 40px', borderTop: '1px solid #272730' }}>
            <div style={{ display: 'flex', color: '#3dd68c', fontSize: 30 }}>sevin.dev</div>
            <div style={{ display: 'flex', color: '#56566a', fontSize: 24 }}>{date}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts },
  );
}
