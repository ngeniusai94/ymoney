-- 가계부 M 계정 전용. public.fn_withdraw_account와 yWeather 객체는 수정하지 않습니다.
-- 호출자 이외의 번호/UUID를 받지 않고 세션에서 결정합니다. 실패 시 전체 작업이 롤백됩니다.
create function ymoney.fn_mon_withdraw_account(p_confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller_uid uuid := auth.uid();
  caller_srno text;
  target_ledger record;
begin
  if caller_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if p_confirmation is distinct from '삭제' then raise exception '확인을 위해 삭제를 입력해주세요.'; end if;

  -- 인증 서버가 만든 최근 세션인지 확인합니다. 단순 토큰 갱신은 재인증으로 취급하지 않습니다.
  if not exists (
    select 1 from auth.sessions s
    where s.id::text = (auth.jwt() ->> 'session_id') and s.user_id = caller_uid
      and s.created_at >= now() - interval '5 minutes'
  ) then raise exception '계정 삭제 전에 다시 로그인해주세요.'; end if;

  select u.user_srno into caller_srno from public.tb_user u
  where u.user_uuid = caller_uid and u.use_yn = 'Y' and u.user_srno ~ '^M[0-9]+$'
  for update;
  if caller_srno is null then raise exception '삭제할 가계부 M 계정이 없습니다.'; end if;

  -- 공용 UUID/회원정보 삭제가 다른 서비스의 데이터를 정리하지 않도록 연결된 계정은 중단합니다.
  if exists (select 1 from public.tb_user_device d where d.user_srno = caller_srno)
     or exists (select 1 from public.tb_push_schedule p where p.user_srno = caller_srno) then
    raise exception '다른 서비스에 연결된 계정은 삭제할 수 없습니다. 관리자에게 문의해주세요.';
  end if;
  -- Apple 연결 해제 경로는 아직 구현되지 않았으므로 우회 삭제를 허용하지 않습니다.
  if exists (select 1 from auth.identities i where i.user_id = caller_uid and i.provider = 'apple') then
    raise exception 'Apple 계정 연결 해제 기능 준비 후 삭제할 수 있습니다.';
  end if;

  -- 가계부를 일정한 ID 순서로 잠가 참여/나가기와 충돌하지 않게 처리합니다.
  for target_ledger in
    select l.ledger_id, l.ledger_type from ymoney.tb_mon_ledger l
    where (l.ledger_type = 'PERSONAL' and l.created_by_user_srno = caller_srno)
       or (l.ledger_type = 'GROUP' and exists (
         select 1 from ymoney.tb_mon_ledger_member m
         where m.ledger_id = l.ledger_id and m.user_srno = caller_srno
       ))
    order by l.ledger_id for update of l
  loop
    if target_ledger.ledger_type = 'GROUP' then
      -- 이미 승인된 나가기 함수를 재사용합니다. 다른 멤버가 남으면 그룹 내역을 유지합니다.
      if exists (select 1 from ymoney.tb_mon_ledger_member m
        where m.ledger_id = target_ledger.ledger_id and m.user_srno = caller_srno) then
        perform ymoney.fn_mon_leave_group(target_ledger.ledger_id);
      end if;
    else
      -- 개인 가계부에 타 회원 연결이 있으면 이상 상태이므로 삭제하지 않습니다.
      if exists (select 1 from ymoney.tb_mon_ledger_member m
        where m.ledger_id = target_ledger.ledger_id and m.user_srno <> caller_srno) then
        raise exception '개인 가계부의 멤버 정보를 확인해주세요.';
      end if;
      delete from ymoney.tb_mon_transaction where ledger_id = target_ledger.ledger_id;
      delete from ymoney.tb_mon_category where ledger_id = target_ledger.ledger_id;
      delete from ymoney.tb_mon_category_group where ledger_id = target_ledger.ledger_id;
      delete from ymoney.tb_mon_payment_method where ledger_id = target_ledger.ledger_id;
      delete from ymoney.tb_mon_ledger where ledger_id = target_ledger.ledger_id;
    end if;
  end loop;

  -- 남은 공유 거래의 작성자/수정자는 기존 FK의 SET NULL로 익명화합니다.
  delete from public.tb_user where user_uuid = caller_uid and user_srno = caller_srno;
  -- Auth의 기존 CASCADE로 본인 identities/sessions 등이 삭제됩니다. 이미 발급된 JWT는 만료까지 남을 수 있습니다.
  delete from auth.users where id = caller_uid;
end;
$$;
revoke all on function ymoney.fn_mon_withdraw_account(text) from public, anon;
grant execute on function ymoney.fn_mon_withdraw_account(text) to authenticated;
