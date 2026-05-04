import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('post_views')
    .select('slug, count');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = Object.fromEntries((data ?? []).map((v) => [v.slug, v.count]));
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 });

  const { data: current } = await supabase
    .from('post_views')
    .select('count')
    .eq('slug', slug)
    .single();

  const newCount = (current?.count ?? 0) + 1;

  const { error } = await supabase
    .from('post_views')
    .upsert({ slug, count: newCount });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: newCount });
}
