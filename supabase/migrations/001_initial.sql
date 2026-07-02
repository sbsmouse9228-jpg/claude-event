-- =============================================
-- MOA v0.1 초기 스키마
-- =============================================

-- UUID 확장 활성화
create extension if not exists "pgcrypto";

-- =============================================
-- users 테이블
-- =============================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text,
  nickname text not null,
  profile_image text,
  created_at timestamptz not null default now()
);

comment on table public.users is '카카오 로그인 사용자 프로필';

-- =============================================
-- events 테이블
-- =============================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  location text not null,
  event_date timestamptz not null,
  max_participants integer check (max_participants is null or max_participants >= 2),
  entry_fee integer check (entry_fee is null or entry_fee >= 0),
  invite_token uuid not null unique default gen_random_uuid(),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is '모임 이벤트';
comment on column public.events.invite_token is '비회원 접근용 초대 토큰 (이벤트 삭제 시 무효화)';

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- =============================================
-- event_participants 테이블 (v0.2 대비)
-- =============================================
create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  attendance text not null default 'pending'
    check (attendance in ('attending', 'absent', 'pending')),
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

comment on table public.event_participants is '이벤트 참여자 목록 및 출석 상태';

-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

-- users
alter table public.users enable row level security;

create policy "사용자 본인 프로필 조회"
  on public.users for select
  using (true);

create policy "본인 프로필 삽입"
  on public.users for insert
  with check (auth.uid() = id);

create policy "본인 프로필 수정"
  on public.users for update
  using (auth.uid() = id);

-- events
alter table public.events enable row level security;

create policy "이벤트 전체 공개 조회 (비회원 포함)"
  on public.events for select
  using (true);

create policy "로그인 사용자만 이벤트 생성"
  on public.events for insert
  with check (auth.uid() = host_id);

create policy "주최자만 이벤트 수정"
  on public.events for update
  using (auth.uid() = host_id);

create policy "주최자만 이벤트 삭제"
  on public.events for delete
  using (auth.uid() = host_id);

-- event_participants
alter table public.event_participants enable row level security;

create policy "참여자 목록 조회"
  on public.event_participants for select
  using (true);

create policy "본인 참여 등록"
  on public.event_participants for insert
  with check (auth.uid() = user_id);

create policy "본인 출석 상태 수정"
  on public.event_participants for update
  using (auth.uid() = user_id);

create policy "본인 또는 주최자가 참여 취소"
  on public.event_participants for delete
  using (
    auth.uid() = user_id or
    auth.uid() = (select host_id from public.events where id = event_id)
  );
