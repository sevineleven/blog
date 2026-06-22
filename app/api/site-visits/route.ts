import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 방문 집계 날짜는 KST 기준. UTC(toISOString)로 하면 오전 9시(=00:00 UTC)에 날짜가 바뀌어
// today 가 그 시각에 0으로 리셋된다(줄어드는 것처럼 보임). +9h 후 자르면 한국 자정에 리셋.
function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function GET() {
  const today = kstToday();

  const { data, error } = await supabase
    .from('site_visits')
    .select('date, count');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const todayCount = data?.find((r) => r.date === today)?.count ?? 0;
  const total = data?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return NextResponse.json({ today: todayCount, total });
}

export async function POST() {
  const today = kstToday();
  const client = supabaseAdmin ?? supabase;

  const { data: current } = await client
    .from('site_visits')
    .select('count')
    .eq('date', today)
    .single();

  const newCount = (current?.count ?? 0) + 1;

  const { error } = await client
    .from('site_visits')
    .upsert({ date: today, count: newCount });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: all } = await client.from('site_visits').select('count');
  const total = all?.reduce((sum, r) => sum + r.count, 0) ?? newCount;

  return NextResponse.json({ ok: true, today: newCount, total });
}
