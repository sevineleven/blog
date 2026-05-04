import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getAllPosts, getAdjacentPosts } from '@/lib/posts';
import '@/app/posts/prose.css';

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return { title: `${post.title} | sevin.dev`, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors mb-10 inline-block">
        ← 목록으로
      </Link>

      <article>
        <header className="mb-10">
          <div className="flex gap-2 mb-3">
            {post.tags.map((t) => (
              <Link key={t} href={`/?tag=${t}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
                #{t}
              </Link>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">{post.title}</h1>
          <time className="text-xs text-zinc-500">{post.date}</time>
        </header>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <nav className="mt-16 pt-8 border-t border-zinc-800 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/posts/${prev.slug}`} className="text-zinc-400 hover:text-white transition-colors max-w-xs">
            <span className="text-xs text-zinc-600 block mb-1">← 이전 글</span>
            {prev.title}
          </Link>
        ) : <div />}
        {next && (
          <Link href={`/posts/${next.slug}`} className="text-zinc-400 hover:text-white transition-colors text-right max-w-xs">
            <span className="text-xs text-zinc-600 block mb-1">다음 글 →</span>
            {next.title}
          </Link>
        )}
      </nav>
    </main>
  );
}
