-- 좋아요 · 대댓글 마이그레이션 (2026-06-22)
-- Supabase SQL Editor 에 붙여넣어 실행한다 (호스팅이라 코드에서 자동 실행 불가).

-- 1) 게시글 좋아요 카운트 (post_views 와 동일 패턴)
create table if not exists post_likes (
  slug text primary key,
  count integer not null default 0
);

-- 2) 댓글에 부모 참조 추가 (1단계 대댓글). 부모 삭제 시 답글도 함께 삭제.
alter table comments
  add column if not exists parent_id uuid
  references comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments(parent_id);
