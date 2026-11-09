-- 공유 가계부 멤버가 기존 지출을 수정할 최소 열만 허용합니다.
-- ledger_id, 작성자, 유형, 삭제 시각은 이번 수정 화면에서 바꿀 수 없습니다.
grant update (
  category_id, payment_method_id, amount, memo, trans_date, trans_time,
  updated_by_user_srno, updated_at
) on ymoney.tb_mon_transaction to authenticated;

create policy ymoney_update_member_transactions
on ymoney.tb_mon_transaction for update to authenticated
using (
  trans_type = 'EXPENSE'
  and deleted_at is null
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_transaction.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
)
with check (
  trans_type = 'EXPENSE'
  and deleted_at is null
  and amount > 0
  and updated_by_user_srno = (
    select u.user_srno from public.tb_user u
    where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
  )
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_transaction.ledger_id
      and lm.user_srno = tb_mon_transaction.updated_by_user_srno
  )
  and exists (
    select 1 from ymoney.tb_mon_category c
    where c.category_id = tb_mon_transaction.category_id
      and c.ledger_id = tb_mon_transaction.ledger_id
  )
  and exists (
    select 1 from ymoney.tb_mon_payment_method pm
    where pm.payment_method_id = tb_mon_transaction.payment_method_id
      and pm.ledger_id = tb_mon_transaction.ledger_id
  )
);
