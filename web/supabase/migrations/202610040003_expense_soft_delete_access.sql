-- 지출 삭제는 실제 행 삭제 대신 deleted_at을 채워 기록과 합계에서 제외합니다.
-- 기존 UPDATE의 멤버 검사·작성자/가계부/유형 열 제한은 그대로 둡니다.
grant update (deleted_at) on ymoney.tb_mon_transaction to authenticated;

alter policy ymoney_update_member_transactions
on ymoney.tb_mon_transaction
with check (
  trans_type = 'EXPENSE'
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
