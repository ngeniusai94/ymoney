-- 기존 그룹의 이름/수정시각만 변경합니다. 개인 가계부와 멤버 연결은 변경하지 않습니다.
grant update (ledger_name, updated_at) on ymoney.tb_mon_ledger to authenticated;
create policy ymoney_update_member_group_name
on ymoney.tb_mon_ledger for update to authenticated
using (
  ledger_type = 'GROUP'
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_ledger.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
)
with check (
  ledger_type = 'GROUP'
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_ledger.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);
