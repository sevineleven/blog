import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 });

  const { data, error } = await supabase
    .from('comments')
    .select('id, author, body, created_at')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });

  if (error) { console.error('[GET comments]', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { post_slug, author, body } = await req.json();
    if (!post_slug || !author?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_slug, author: author.trim(), body: body.trim() })
      .select('id, author, body, created_at')
      .single();

    if (error) { console.error('[POST comments]', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('[POST comments] unexpected', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const secret = req.headers.get('x-admin-secret');

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin ?? supabase;
  const { error } = await client.from('comments').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
