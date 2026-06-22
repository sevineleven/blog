import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 전체 좋아요 맵 { slug: count } — 홈/목록 일괄 표시용. post_views GET 과 동일 형태.
export async function GET() {
  const { data, error } = await supabase.from('post_likes').select('slug, count');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map = Object.fromEntries((data ?? []).map((v) => [v.slug, v.count]));
  return NextResponse.json(map);
}

// 좋아요 토글. action 으로 ±1, 0 미만으로는 안 내려간다. 중복 방지는 클라(localStorage) 책임.
export async function POST(req: NextRequest) {
  const { slug, action } = await req.json();
  if (!slug || (action !== 'like' && action !== 'unlike')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { data: current } = await supabase
    .from('post_likes')
    .select('count')
    .eq('slug', slug)
    .single();

  const delta = action === 'like' ? 1 : -1;
  const newCount = Math.max(0, (current?.count ?? 0) + delta);

  const { error } = await supabase.from('post_likes').upsert({ slug, count: newCount });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: newCount });
}
