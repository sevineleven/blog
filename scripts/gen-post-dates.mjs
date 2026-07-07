// 각 포스트의 발행(최초 git 커밋)·업데이트(최근 git 커밋) 시각을 lib/post-dates.json 에 굽는다.
// Vercel 은 shallow clone 이라 빌드 때 `git log` 이력이 안 잡혀 frontmatter 로 fallback 된다.
// 이 매니페스트를 커밋해 두면 프로덕션도 git 없이 정확한 발행일을 쓴다.
//
// 새 글은 아직 커밋 이력이 없으므로 "지금 시각"으로 채운다(≈ 실제 첫 커밋 시각).
// 다음 실행 때 실제 git 최초 커밋값으로 자동 교정된다.
//
// 사용: node scripts/gen-post-dates.mjs   (포스트 커밋 직전에 실행 → JSON 을 함께 커밋)

import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';

const POSTS = 'posts';
const OUT = 'lib/post-dates.json';

const files = readdirSync(POSTS).filter((f) => f.endsWith('.md')).sort();
const now = new Date().toISOString();
const map = {};

for (const f of files) {
  let publishedISO;
  let updatedISO;
  try {
    const out = execSync(`git log --format=%aI -- "${POSTS}/${f}"`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length) {
      updatedISO = lines[0];                 // 최신순 — 첫 줄이 최근
      publishedISO = lines[lines.length - 1]; // 마지막 줄이 최초
    }
  } catch {
    // git 없음 → 아래 fallback
  }
  if (!publishedISO) {
    publishedISO = now; // 아직 커밋 안 된 새 글
    updatedISO = now;
  }
  map[f] = { publishedISO, updatedISO };
}

writeFileSync(OUT, JSON.stringify(map, null, 2) + '\n');
console.log(`wrote ${OUT} — ${files.length} posts`);
