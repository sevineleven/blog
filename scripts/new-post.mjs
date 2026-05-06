import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'posts');

const CATEGORIES = ['프론트엔드', '백엔드', '일상', '기타'];

const title = process.argv.slice(2).join(' ');
if (!title) {
  console.error('사용법: npm run new-post "포스트 제목"');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('\n카테고리를 선택하세요:');
  CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));

  const catAnswer = await ask('\n카테고리 (번호 또는 이름): ');
  const catIdx = parseInt(catAnswer) - 1;
  const category = (catIdx >= 0 && catIdx < CATEGORIES.length)
    ? CATEGORIES[catIdx]
    : (catAnswer.trim() || '기타');

  const slugAnswer = await ask('영문 slug (예: my-first-post): ');
  rl.close();

  const rawSlug = slugAnswer.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  if (!rawSlug) {
    console.error('\nslug를 입력해주세요.');
    process.exit(1);
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${rawSlug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`\n이미 존재하는 파일: posts/${filename}`);
    process.exit(1);
  }

  const content = `---
title: "${title}"
date: ${date}
category: ${category}
tags: []
excerpt: ""
draft: true
---

##

`;

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);
  fs.writeFileSync(filepath, content, 'utf-8');

  const imgDir = path.join(__dirname, '..', 'public', 'posts', rawSlug);
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  console.log(`\n✓ 생성됨: posts/${filename}`);
  console.log(`  이미지 폴더: public/posts/${rawSlug}/`);
  console.log(`  URL: /posts/${rawSlug}`);
  console.log(`  category: ${category}`);
  console.log(`  draft: true  →  완성 후 false로 변경하면 publish됩니다.\n`);
}

main();
