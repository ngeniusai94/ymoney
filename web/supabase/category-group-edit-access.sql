-- 그룹 이름 수정: 이름/수정시각만 허용합니다. 새 테이블·함수·트리거 없음.
grant update (group_name, updated_at) on ymoney.tb_mon_category_group to authenticated;

create policy ymoney_update_member_category_groups
on ymoney.tb_mon_category_group for update to authenticated
using (
  trans_type = 'EXPENSE' and is_active = true
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
  trans_type = 'EXPENSE' and is_active = true
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_category_group.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);
