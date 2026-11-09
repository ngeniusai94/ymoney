-- 기존 그룹의 이름 수정 권한은 유지하고 활성 상태 변경만 추가합니다.
grant update (is_active) on ymoney.tb_mon_category_group to authenticated;

alter policy ymoney_update_member_category_groups
on ymoney.tb_mon_category_group
using (
  trans_type = 'EXPENSE'
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_category_group.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
)
with check (
  trans_type = 'EXPENSE'
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_category_group.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);
