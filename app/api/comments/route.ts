import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 });

  const { data, error } = await supabase
    .from('comments')
    .select('id, author, body, created_at, parent_id, is_owner')
    .eq('post_slug', slug)
    .order('created_at', { ascending: true });

  if (error) { console.error('[GET comments]', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { post_slug, author, body, parent_id } = await req.json();
    if (!post_slug || !author?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    // 오너(글쓴이) 검증 — x-owner-secret 이 ADMIN_SECRET 과 일치할 때만 글쓴이로 박는다(사칭 방지).
    // 일치하면 author 를 'sevineleven' 으로 강제하고 is_owner=true.
    const isOwner =
      !!process.env.ADMIN_SECRET && req.headers.get('x-owner-secret') === process.env.ADMIN_SECRET;
    const finalAuthor = isOwner ? 'sevineleven' : author.trim();

    // 답글이면 부모가 같은 글의 댓글인지 가볍게 검증 (아니면 최상위로 떨군다)
    let parentId: string | null = null;
    if (parent_id) {
      const { data: parent } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_slug', post_slug)
        .single();
      parentId = parent?.id ?? null;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_slug, author: finalAuthor, body: body.trim(), parent_id: parentId, is_owner: isOwner, password_hash: '' })
      .select('id, author, body, created_at, parent_id, is_owner')
      .single();

    if (error) { console.error('[POST comments]', error); return NextResponse.json({ error: error.message }, { status: 500 }); }

    resend?.emails.send({
      from: 'blog@sevin.dev',
      to: process.env.NOTIFICATION_EMAIL!,
      subject: `[블로그] ${parentId ? '새 답글' : '새 댓글'} - ${post_slug}`,
      text: `${data.author}: ${data.body.slice(0, 100)}\n\nhttps://blog.sevin.dev/posts/${post_slug}#comments`,
    }).catch((e) => console.error('[notify comment]', e));

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
