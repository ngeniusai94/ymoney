-- 중단된 이메일 가입안의 보존본입니다. 현재 아이디 가입에는 실행하지 마세요.
-- 원격 적용 여부를 확인하기 전에는 원격 함수를 삭제하지 않습니다.
-- 전제: 공유 테이블 public.tb_user.user_id 컬럼에 가입 이메일이 저장됩니다.
-- 실행 전 실제 저장 컬럼/값 형식이 이 전제와 맞는지 확인해주세요.

-- 회원가입 화면에서 해당 이메일의 서비스 프로필 존재 여부만 확인합니다.
-- SECURITY DEFINER로 기존 tb_user RLS는 유지하고, 원문 사용자 행은 반환하지 않습니다.
CREATE OR REPLACE FUNCTION public.fn_mon_is_registered_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.tb_user AS user_row
    WHERE lower(btrim(user_row.user_id)) = lower(btrim(p_email))
  );
$function$;

-- 기본 PUBLIC 실행 권한을 회수하고 가입 화면의 비로그인/로그인 역할만 허용합니다.
REVOKE ALL ON FUNCTION public.fn_mon_is_registered_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_mon_is_registered_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.fn_mon_is_registered_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_mon_is_registered_email(text) TO anon, authenticated;

COMMENT ON FUNCTION public.fn_mon_is_registered_email(text) IS
  'Returns only whether tb_user.user_id matches the submitted signup email; does not return user data.';
