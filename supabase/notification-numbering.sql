-- 검토용: 공용 알림/기기 번호를 RLS 조회 결과와 분리합니다.
-- 기존 행과 P/D 접두사는 보존합니다. 새로운 테이블/함수는 만들지 않습니다.
-- 새 시퀀스 2개를 만들고 기존 채번 함수 2개의 본문만 교체합니다.
-- yWeather/ymoney 모두 같은 함수를 사용하므로 공용 변경으로 검토 후 실행합니다.
begin;

create sequence public.seq_push_srno as bigint minvalue 1 maxvalue 999999999;
create sequence public.seq_device_srno as bigint minvalue 1 maxvalue 999999999;

-- 초기 번호를 정하는 동안 새 행의 INSERT/UPDATE/DELETE를 잠시 대기시킵니다.
lock table public.tb_push_schedule, public.tb_user_device in share row exclusive mode;
do $$
declare
  highest_push bigint;
  highest_device bigint;
begin
  select coalesce(max(substring(push_srno from 2)::bigint), 0) into highest_push
  from public.tb_push_schedule where push_srno ~ '^P[0-9]+$';
  select coalesce(max(substring(device_srno from 2)::bigint), 0) into highest_device
  from public.tb_user_device where device_srno ~ '^D[0-9]+$';
  -- 빈 테이블이면 시퀀스의 최초 값 1을 그대로 사용합니다.
  if highest_push > 0 then perform pg_catalog.setval('public.seq_push_srno'::regclass, highest_push, true); end if;
  if highest_device > 0 then perform pg_catalog.setval('public.seq_device_srno'::regclass, highest_device, true); end if;
end;
$$;

revoke all on sequence public.seq_push_srno, public.seq_device_srno from public, anon, authenticated;
grant usage on sequence public.seq_push_srno, public.seq_device_srno to authenticated, service_role;

-- 호출자 권한으로 nextval만 실행합니다. 테이블 전체 조회나 RLS 우회는 하지 않습니다.
create or replace function public.fn_next_push_srno()
returns text language plpgsql security invoker set search_path = '' as $$
declare
  next_no text;
begin
  next_no := pg_catalog.nextval('public.seq_push_srno'::regclass)::text;
  return 'P' || pg_catalog.lpad(next_no, greatest(4, length(next_no)), '0');
end;
$$;

create or replace function public.fn_next_device_srno()
returns text language plpgsql security invoker set search_path = '' as $$
declare
  next_no text;
begin
  next_no := pg_catalog.nextval('public.seq_device_srno'::regclass)::text;
  return 'D' || pg_catalog.lpad(next_no, greatest(4, length(next_no)), '0');
end;
$$;

revoke all on function public.fn_next_push_srno(), public.fn_next_device_srno() from public, anon;
grant execute on function public.fn_next_push_srno(), public.fn_next_device_srno() to authenticated, service_role;

commit;
-- 번호는 실패한 저장에서도 소비되므로 연속 번호를 보장하지 않습니다.
-- 동시 요청/서로 다른 계정에서도 중복 없이 발급하는 용도입니다.
-- 반영 직전 구버전 함수로 발급한 번호를 보유한 요청은 재시도가 필요할 수 있습니다.
