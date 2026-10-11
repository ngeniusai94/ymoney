-- 2026-10-05 사용자 승인 후 category_edit_access로 원격 적용. 새 테이블·함수·트리거 없음.
-- ID, 가계부, 부모, 유형, 정렬, 활성 여부는 이 수정 경로로 변경하지 않습니다.
grant update (category_name, icon_key, category_group_id, updated_at)
on ymoney.tb_mon_category to authenticated;

create policy ymoney_update_member_categories
on ymoney.tb_mon_category for update to authenticated
using (
  trans_type = 'EXPENSE' and is_active = true
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_category.ledger_id
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
    where lm.ledger_id = tb_mon_category.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
  and (category_group_id is null or exists (
    select 1 from ymoney.tb_mon_category_group cg
    where cg.category_group_id = tb_mon_category.category_group_id
      and cg.ledger_id = tb_mon_category.ledger_id
  ))
  and (parent_category_id is null or (category_group_id is null and icon_key is null))
);
