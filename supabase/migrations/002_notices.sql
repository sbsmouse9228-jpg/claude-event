-- =============================================
-- MOA v0.2 공지 테이블
-- =============================================

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.notices is '이벤트 공지사항';

alter table public.notices enable row level security;

create policy "공지 전체 공개 조회"
  on public.notices for select using (true);

create policy "주최자만 공지 작성"
  on public.notices for insert
  with check (
    auth.uid() = author_id and
    auth.uid() = (select host_id from public.events where id = event_id)
  );

create policy "주최자만 공지 삭제"
  on public.notices for delete
  using (
    auth.uid() = (select host_id from public.events where id = event_id)
  );
