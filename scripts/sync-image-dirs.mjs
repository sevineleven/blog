import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'posts');
const IMG_BASE = path.join(__dirname, '..', 'public', 'posts');

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const slug = file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const dir = path.join(IMG_BASE, slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`created: public/posts/${slug}/`);
  }
}

console.log(`synced ${files.length} posts.`);
