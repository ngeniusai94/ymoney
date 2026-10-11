-- 2026-10-05 적용: 부모를 소스에서 확인하고 INSERT 정책 재귀를 제거합니다.
-- 새 테이블·함수·트리거·권한은 만들지 않습니다.
-- 부모의 가계부/활성/최대 2단계 검사는 저장 직전 소스의 SELECT에서 수행합니다.
alter policy ymoney_insert_member_categories
on ymoney.tb_mon_category
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
  and (
    parent_category_id is null
    or (
      -- 같은 테이블을 다시 조회하면 INSERT 정책 재귀가 발생하므로 여기서 부모를 SELECT하지 않습니다.
      -- 부모 존재는 기존 외래키가 확인합니다. 하위는 그룹/아이콘을 저장하지 않습니다.
      category_group_id is null and icon_key is null
    )
  )
);
