import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';

const POSTS_DIR = path.join(process.cwd(), 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  draft: boolean;
  excerpt: string;
}

export interface Post extends PostMeta {
  content: string;
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
      const slug = filename.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ? String(data.date) : '',
        tags: data.tags ?? [],
        draft: data.draft ?? false,
        excerpt: getExcerpt(content, data.excerpt),
      };
    })
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  const filepath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, 'utf-8');
  const { data, content } = matter(raw);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, {
      theme: 'github-dark',
      keepBackground: true,
    })
    .use(rehypeStringify)
    .process(content);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ? String(data.date) : '',
    tags: data.tags ?? [],
    draft: data.draft ?? false,
    excerpt: getExcerpt(content, data.excerpt),
    content: String(processed),
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set(posts.flatMap((p) => p.tags));
  return Array.from(tagSet).sort();
}

export function getAdjacentPosts(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
    next: idx > 0 ? posts[idx - 1] : null,
  };
}
