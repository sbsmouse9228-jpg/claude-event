-- =============================================
-- MOA Web Push 구독 테이블
-- =============================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

comment on table public.push_subscriptions is 'Web Push 알림 구독 정보';

alter table public.push_subscriptions enable row level security;

create policy "본인 구독 조회"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "본인 구독 등록"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "본인 구독 삭제"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
