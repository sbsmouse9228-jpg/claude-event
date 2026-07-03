-- =============================================
-- MOA v0.4 정산 테이블
-- =============================================

-- 정산 항목
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  item_name text not null,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

comment on table public.settlements is '이벤트 정산 항목';

-- 납부 내역 (항목별 참여자 분담)
create table if not exists public.settlement_payments (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount_due integer not null check (amount_due >= 0),
  paid_at timestamptz,
  unique (settlement_id, user_id)
);

comment on table public.settlement_payments is '정산 항목별 납부 내역 (paid_at = null이면 미납)';

-- =============================================
-- RLS 정책
-- =============================================

alter table public.settlements enable row level security;

create policy "정산 항목 전체 공개 조회"
  on public.settlements for select
  using (true);

create policy "주최자만 정산 항목 생성"
  on public.settlements for insert
  with check (
    auth.uid() = (select host_id from public.events where id = event_id)
  );

create policy "주최자만 정산 항목 삭제"
  on public.settlements for delete
  using (
    auth.uid() = (select host_id from public.events where id = event_id)
  );

alter table public.settlement_payments enable row level security;

create policy "납부 내역 전체 공개 조회"
  on public.settlement_payments for select
  using (true);

create policy "주최자가 납부 내역 생성"
  on public.settlement_payments for insert
  with check (
    auth.uid() = (
      select e.host_id
      from public.settlements s
      join public.events e on e.id = s.event_id
      where s.id = settlement_id
    )
  );

create policy "본인 또는 주최자가 납부 상태 변경"
  on public.settlement_payments for update
  using (
    auth.uid() = user_id or
    auth.uid() = (
      select e.host_id
      from public.settlements s
      join public.events e on e.id = s.event_id
      where s.id = settlement_id
    )
  );

create policy "주최자만 납부 내역 삭제"
  on public.settlement_payments for delete
  using (
    auth.uid() = (
      select e.host_id
      from public.settlements s
      join public.events e on e.id = s.event_id
      where s.id = settlement_id
    )
  );
