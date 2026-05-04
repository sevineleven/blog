import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const posts = getAllPosts().filter((p) => !tag || p.tags.includes(tag));
  const tags = getAllTags();

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-1">sevin.dev</h1>
        <p className="text-zinc-500 text-sm">배우고 기록하는 개발자의 공간</p>
        <Link
          href="/universe"
          className="inline-block mt-4 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-400 px-3 py-1 rounded-full transition-colors"
        >
          ✦ 우주 뷰로 보기
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/"
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !tag
              ? 'bg-white text-black border-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-white'
          }`}
        >
          전체
        </Link>
        {tags.map((t) => (
          <Link
            key={t}
            href={`/?tag=${t}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              tag === t
                ? 'bg-white text-black border-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-white'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <ul className="space-y-10">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/posts/${post.slug}`} className="group block">
              <time className="text-xs text-zinc-500">{post.date}</time>
              <h2 className="text-xl font-semibold mt-1 group-hover:text-zinc-300 transition-colors">
                {post.title}
              </h2>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed">{post.excerpt}</p>
              <div className="flex gap-2 mt-3">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs text-zinc-600">
                    #{t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-zinc-600 text-sm">포스트가 없습니다.</li>
        )}
      </ul>
    </main>
  );
}
