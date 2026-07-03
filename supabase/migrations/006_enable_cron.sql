-- 006_enable_cron.sql
-- pg_cron: Edge Function 스케줄 설정 (Supabase 대시보드 Schedule 탭 활성화에 필요)
-- pg_net: DB에서 HTTP 요청 발송 (cron → Edge Function 호출)

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

-- ============================================================
-- send-reminders Edge Function 일별 실행 스케줄
-- 매일 KST 09:00 (UTC 00:00)에 D-1 리마인드 발송
-- ⚠️  SUPABASE_SERVICE_ROLE_KEY 값은 아래에서 직접 교체 필요
--    (Supabase 대시보드 → Settings → API → service_role key)
-- ============================================================
select cron.schedule(
  'send-reminders-d1',
  '0 0 * * *',
  $$
  select
    net.http_post(
      url     := 'https://uygbsswlyiyhsmawgkdv.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
                 ),
      body    := '{}'::jsonb
    ) as request_id;
  $$
);
