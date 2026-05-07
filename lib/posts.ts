import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import GithubSlugger from 'github-slugger';

const POSTS_DIR = path.join(process.cwd(), 'posts');

// YYYY-MM-DD- 접두사 제거 → 짧은 영문 slug
function filenameToSlug(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  draft: boolean;
  excerpt: string;
  readTime: number; // minutes
  series?: string;
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface Post extends PostMeta {
  content: string;
  headings: Heading[];
}

function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const line of markdown.split('\n')) {
    const m2 = line.match(/^## (.+)/);
    if (m2) { headings.push({ id: slugger.slug(m2[1]), text: m2[1], level: 2 }); continue; }
    const m3 = line.match(/^### (.+)/);
    if (m3) { headings.push({ id: slugger.slug(m3[1]), text: m3[1], level: 3 }); }
  }
  return headings;
}

// gray-matter가 YAML date를 Date 객체로 파싱하므로 YYYY-MM-DD KST 형식으로 정규화
function formatDate(raw: unknown): string {
  if (!raw) return '';
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (isNaN(d.getTime())) return String(raw);
  // UTC → KST (+9h) 변환
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y  = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dy = String(kst.getUTCDate()).padStart(2, '0');
  const h  = String(kst.getUTCHours()).padStart(2, '0');
  const mi = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${dy} ${h}:${mi} KST`;
}

function getExcerpt(content: string, meta?: string): string {
  if (meta) return meta;
  return content.replace(/^#+\s.*/gm, '').replace(/[#*`[\]()]/g, '').trim().slice(0, 150);
}

export function getAllPosts(includeDrafts = false): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const slug = filenameToSlug(filename);
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
      const { data, content } = matter(raw);
      const wordCount = content.trim().split(/\s+/).length;
      return {
        slug,
        title: data.title ?? slug,
        date: formatDate(data.date),
        category: data.category ?? '기타',
        tags: data.tags ?? [],
        draft: data.draft ?? false,
        excerpt: getExcerpt(content, data.excerpt),
        readTime: Math.max(1, Math.round(wordCount / 200)),
        series: data.series ?? undefined,
      };
    })
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!fs.existsSync(POSTS_DIR)) return null;

  const filename = fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .find((f) => filenameToSlug(f) === slug);

  if (!filename) return null;

  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
  const { data, content } = matter(raw);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: {
        dark: 'github-dark',
        light: 'github-light',
      },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(content);

  const wordCount = content.trim().split(/\s+/).length;
  return {
    slug,
    title: data.title ?? slug,
    date: formatDate(data.date),
    category: data.category ?? '기타',
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    excerpt: getExcerpt(content, data.excerpt),
    readTime: Math.max(1, Math.round(wordCount / 200)),
    series: data.series ?? undefined,
    content: String(processed),
    headings: extractHeadings(content),
  };
}

export function getPostRawContent(slug: string): string | null {
  if (!fs.existsSync(POSTS_DIR)) return null;
  const filename = fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .find((f) => filenameToSlug(f) === slug);
  if (!filename) return null;
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
  const { content } = matter(raw);
  return content;
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set(posts.flatMap((p) => p.tags));
  return Array.from(tagSet).sort();
}

export function getSeriesPosts(series: string): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.series === series)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getAdjacentPosts(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
    next: idx > 0 ? posts[idx - 1] : null,
  };
}
