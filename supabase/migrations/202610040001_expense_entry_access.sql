-- 지출 입력 단계에 필요한 읽기/추가 권한만 엽니다. 수정·삭제는 다음 화면 단계에서 검토합니다.
grant select, insert on ymoney.tb_mon_category_group to authenticated;
grant insert on ymoney.tb_mon_category to authenticated;
grant select, insert on ymoney.tb_mon_payment_method to authenticated;
grant insert on ymoney.tb_mon_transaction to authenticated;

create policy ymoney_select_member_category_groups
on ymoney.tb_mon_category_group for select to authenticated
using (exists (
  select 1 from ymoney.tb_mon_ledger_member lm
  where lm.ledger_id = tb_mon_category_group.ledger_id
    and lm.user_srno = (
      select u.user_srno from public.tb_user u
      where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
    )
));

create policy ymoney_insert_member_category_groups
on ymoney.tb_mon_category_group for insert to authenticated
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

create policy ymoney_insert_member_categories
on ymoney.tb_mon_category for insert to authenticated
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
  -- 하위 카테고리 추가는 관리 화면 단계에서 별도 정책을 연다.
  and parent_category_id is null
);

create policy ymoney_select_member_payment_methods
on ymoney.tb_mon_payment_method for select to authenticated
using (exists (
  select 1 from ymoney.tb_mon_ledger_member lm
  where lm.ledger_id = tb_mon_payment_method.ledger_id
    and lm.user_srno = (
      select u.user_srno from public.tb_user u
      where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
    )
));

create policy ymoney_insert_member_payment_methods
on ymoney.tb_mon_payment_method for insert to authenticated
with check (
  method_type in ('CARD', 'CASH')
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_payment_method.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);

create policy ymoney_insert_member_transactions
on ymoney.tb_mon_transaction for insert to authenticated
with check (
  trans_type = 'EXPENSE'
  and amount > 0
  and deleted_at is null
  and created_by_user_srno = (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_transaction.ledger_id
      and lm.user_srno = tb_mon_transaction.created_by_user_srno
  )
  and exists (
    select 1 from ymoney.tb_mon_category c
    where c.category_id = tb_mon_transaction.category_id
      and c.ledger_id = tb_mon_transaction.ledger_id
      and c.is_active = true
  )
  and exists (
    select 1 from ymoney.tb_mon_payment_method pm
    where pm.payment_method_id = tb_mon_transaction.payment_method_id
      and pm.ledger_id = tb_mon_transaction.ledger_id
      and pm.is_active = true
  )
);
