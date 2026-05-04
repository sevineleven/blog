import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'posts');

const title = process.argv.slice(2).join(' ');
if (!title) {
  console.error('사용법: npm run new-post "포스트 제목"');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];
const slug = `${date}-${title
  .toLowerCase()
  .replace(/[^a-z0-9가-힣\s]/g, '')
  .trim()
  .replace(/\s+/g, '-')}`;

const content = `---
title: "${title}"
date: ${date}
tags: []
draft: true
---

여기서부터 작성하세요.
`;

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR);

const filepath = path.join(POSTS_DIR, `${slug}.md`);
if (fs.existsSync(filepath)) {
  console.error(`이미 존재하는 파일: ${filepath}`);
  process.exit(1);
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log(`✓ 생성됨: posts/${slug}.md`);
