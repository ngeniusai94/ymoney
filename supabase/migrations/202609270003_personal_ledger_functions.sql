-- 로그인 사용자의 기본 개인 가계부와 멤버십을 한 트랜잭션에서 준비합니다.
-- 앱은 이 함수만 호출하며, 사용자 번호는 요청값이 아닌 인증 세션에서 확인합니다.
create or replace function ymoney.fn_mon_ensure_personal_ledger()
returns bigint
language sql
volatile
security definer
set search_path = ''
as $$
  insert into ymoney.tb_mon_ledger (ledger_type, ledger_name, created_by_user_srno)
  select 'PERSONAL', '개인 가계부', u.user_srno
  from public.tb_user u
  where u.user_uuid = auth.uid()
    and u.use_yn = 'Y'
    and left(u.user_srno, 1) = 'M'
  on conflict do nothing;

  insert into ymoney.tb_mon_ledger_member (ledger_id, user_srno)
  select l.ledger_id, u.user_srno
  from public.tb_user u
  join ymoney.tb_mon_ledger l
    on l.created_by_user_srno = u.user_srno
   and l.ledger_type = 'PERSONAL'
  where u.user_uuid = auth.uid()
    and u.use_yn = 'Y'
    and left(u.user_srno, 1) = 'M'
  on conflict do nothing;

  select l.ledger_id
  from public.tb_user u
  join ymoney.tb_mon_ledger l
    on l.created_by_user_srno = u.user_srno
   and l.ledger_type = 'PERSONAL'
  where u.user_uuid = auth.uid()
    and u.use_yn = 'Y'
    and left(u.user_srno, 1) = 'M'
  limit 1;
$$;

-- 화면의 목록 조회와 생성은 별도 함수입니다. 전달된 번호도 세션 소유인지 확인합니다.
create or replace function ymoney.fn_mon_list_my_ledgers(p_user_srno text)
returns table (ledger_id bigint, ledger_type text, ledger_name varchar(50))
language sql
stable
security invoker
set search_path = ''
as $$
  select l.ledger_id, l.ledger_type, l.ledger_name
  from public.tb_user u
  join ymoney.tb_mon_ledger_member m on m.user_srno = u.user_srno
  join ymoney.tb_mon_ledger l on l.ledger_id = m.ledger_id
  where u.user_uuid = auth.uid()
    and u.use_yn = 'Y'
    and u.user_srno = p_user_srno
  order by l.ledger_id;
$$;

revoke execute on function ymoney.fn_mon_ensure_personal_ledger() from public, anon;
revoke execute on function ymoney.fn_mon_list_my_ledgers(text) from public, anon;
grant execute on function ymoney.fn_mon_ensure_personal_ledger() to authenticated;
grant execute on function ymoney.fn_mon_list_my_ledgers(text) to authenticated;
