-- 비활성화만 추가합니다. USING의 활성 행/가계부 멤버 제한은 유지합니다.
-- 실제 DELETE 권한, 새 테이블·함수·트리거는 추가하지 않습니다.
grant update (is_active) on ymoney.tb_mon_category to authenticated;

alter policy ymoney_update_member_categories on ymoney.tb_mon_category
with check (
  trans_type = 'EXPENSE'
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
