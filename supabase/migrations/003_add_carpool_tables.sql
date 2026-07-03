-- =============================================
-- MOA v0.3 카풀 테이블
-- =============================================

-- 카풀 차량 등록
create table if not exists public.carpool_cars (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  driver_id uuid not null references public.users(id) on delete cascade,
  departure_location text not null,
  departure_time timestamptz not null,
  available_seats integer not null check (available_seats >= 1),
  created_at timestamptz not null default now()
);

comment on table public.carpool_cars is '카풀 차량 제공 등록';

-- 카풀 탑승 신청
create table if not exists public.carpool_requests (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.carpool_cars(id) on delete cascade,
  passenger_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (car_id, passenger_id)
);

comment on table public.carpool_requests is '카풀 탑승 신청 및 수락 상태';

-- =============================================
-- RLS 정책
-- =============================================

-- carpool_cars
alter table public.carpool_cars enable row level security;

create policy "카풀 목록 전체 공개 조회"
  on public.carpool_cars for select
  using (true);

create policy "로그인 사용자만 카풀 등록"
  on public.carpool_cars for insert
  with check (auth.uid() = driver_id);

create policy "운전자만 카풀 정보 수정"
  on public.carpool_cars for update
  using (auth.uid() = driver_id);

create policy "운전자만 카풀 삭제"
  on public.carpool_cars for delete
  using (auth.uid() = driver_id);

-- carpool_requests
alter table public.carpool_requests enable row level security;

create policy "운전자·탑승 신청자만 신청 조회"
  on public.carpool_requests for select
  using (
    auth.uid() = passenger_id or
    auth.uid() = (select driver_id from public.carpool_cars where id = car_id)
  );

create policy "로그인 사용자만 탑승 신청"
  on public.carpool_requests for insert
  with check (auth.uid() = passenger_id);

create policy "운전자만 신청 수락·거절"
  on public.carpool_requests for update
  using (
    auth.uid() = (select driver_id from public.carpool_cars where id = car_id)
  );

create policy "탑승자 본인만 신청 취소"
  on public.carpool_requests for delete
  using (auth.uid() = passenger_id);
