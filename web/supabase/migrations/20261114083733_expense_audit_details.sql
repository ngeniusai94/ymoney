-- 거래 번호로 등록·수정 이력 한 건을 조회합니다.
create function ymoney.fn_mon_expense_audit(p_transaction_id bigint)
returns table (
  creator_nickname text,
  created_at timestamptz,
  editor_nickname text,
  updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select
    coalesce(nullif(btrim(creator.nickname), ''), '알 수 없음'),
    t.created_at,
    case when t.updated_by_user_srno is not null
      then coalesce(nullif(btrim(editor.nickname), ''), '알 수 없음')
    end,
    case when t.updated_by_user_srno is not null then t.updated_at end
  from ymoney.tb_mon_transaction t
  -- 최초 등록자와 마지막 수정자를 각자의 회원번호로 찾습니다.
  left join public.tb_user creator
    on creator.user_srno = t.created_by_user_srno and creator.use_yn = 'Y'
  left join public.tb_user editor
    on editor.user_srno = t.updated_by_user_srno and editor.use_yn = 'Y'
  where t.transaction_id = p_transaction_id
    and t.trans_type = 'EXPENSE'
    and t.deleted_at is null
    -- 호출자는 이 지출이 현재 속한 가계부의 활성 회원이어야 합니다.
    and exists (
      select 1
      from ymoney.tb_mon_ledger_member m
      join public.tb_user caller on caller.user_srno = m.user_srno
      where m.ledger_id = t.ledger_id
        and caller.user_uuid = (select auth.uid())
        and caller.use_yn = 'Y'
        and caller.user_srno ~ '^M[0-9]+$'
    );
$$;

revoke execute on function ymoney.fn_mon_expense_audit(bigint) from public, anon;
grant execute on function ymoney.fn_mon_expense_audit(bigint) to authenticated;
