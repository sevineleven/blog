import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('site_visits')
    .select('date, count');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const todayCount = data?.find((r) => r.date === today)?.count ?? 0;
  const total = data?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return NextResponse.json({ today: todayCount, total });
}

export async function POST() {
  const today = new Date().toISOString().slice(0, 10);
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
