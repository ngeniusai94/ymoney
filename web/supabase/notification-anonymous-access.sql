-- 공용 알림 테이블은 로그인 전 클라이언트에서 직접 접근할 수 없습니다.
-- authenticated/service_role 권한과 기존 yWeather 데이터는 보존합니다.
-- 로그인 사용자 간 본인 행 격리는 별도 RLS 검토 대상입니다.
begin;
revoke all privileges on table public.tb_user_device, public.tb_push_schedule from anon;
commit;
