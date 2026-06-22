-- 오너(글쓴이) 댓글 표시 (2026-06-22)
-- Supabase SQL Editor 에 붙여넣어 실행한다.
-- is_owner = true 인 댓글은 프로필 사진 + 'sevineleven · 글쓴이' 로 렌더된다.
-- 서버가 x-owner-secret 헤더를 ADMIN_SECRET 과 대조해 맞을 때만 true 로 박는다(사칭 방지).

alter table comments
  add column if not exists is_owner boolean not null default false;
