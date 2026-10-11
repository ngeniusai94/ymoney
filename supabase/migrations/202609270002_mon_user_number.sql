-- 사용자 승인됨. Supabase SQL Editor에서 한 번만 실행합니다.
-- 공유 yWeather의 W 채번 함수/시퀀스와 tb_user 구조는 변경하지 않습니다.
-- W 함수의 트랜잭션 잠금은 RPC 응답과 별도 INSERT 사이까지 유지되지 않습니다.
-- 따라서 두 요청 사이의 동시 가입 충돌을 피하려고 M 전용 시퀀스를 사용합니다.
CREATE SEQUENCE public.mon_user_srno_seq;

-- 기존 M 번호가 있다면 그 최대값 다음부터 발급합니다.
SELECT pg_catalog.setval(
  'public.mon_user_srno_seq'::regclass,
  GREATEST(1, COALESCE(MAX(pg_catalog.substr(user_srno, 2)::bigint), 0)),
  COALESCE(MAX(pg_catalog.substr(user_srno, 2)::bigint), 0) > 0
)
FROM public.tb_user
WHERE user_srno ~ '^M[0-9]+$';

CREATE FUNCTION public.fn_mon_next_user_srno()
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'M' || pg_catalog.lpad(pg_catalog.nextval('public.mon_user_srno_seq'::regclass)::text, 4, '0')
$$;

REVOKE ALL ON SEQUENCE public.mon_user_srno_seq FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_mon_next_user_srno() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_mon_next_user_srno() TO authenticated;
