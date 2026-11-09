-- yWeather와 ymoney가 공유하는 알림 테이블의 본인 행 접근 규칙입니다.
-- 앱 구분(app_cd)은 각 서비스의 CRUD 조건에서 유지합니다.
-- tb_user의 본인 SELECT 정책을 이용하므로 별도 보안 함수는 필요하지 않습니다.
begin;

revoke all privileges on table public.tb_user_device, public.tb_push_schedule from anon;
-- RLS를 우회하는 TRUNCATE 등은 클라이언트에 제공하지 않습니다.
revoke truncate, references, trigger, maintain on table public.tb_user_device, public.tb_push_schedule from authenticated;

alter table public.tb_user_device enable row level security;
alter table public.tb_push_schedule enable row level security;

create policy notification_device_owner on public.tb_user_device
for all to authenticated
using (
  coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  and user_srno in (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
)
with check (
  coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  and user_srno in (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
);

create policy notification_schedule_owner on public.tb_push_schedule
for all to authenticated
using (
  coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  and user_srno in (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
)
with check (
  coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  and user_srno in (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
);

commit;
