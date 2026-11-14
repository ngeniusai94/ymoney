-- 기존 UPDATE 정책은 원래 가계부 멤버와 분류·결제수단 소속을 확인합니다.
-- 대상 가계부 멤버십은 제한 정책으로도 확인합니다.
create policy ymoney_update_transaction_destination_member
on ymoney.tb_mon_transaction as restrictive for update to authenticated
with check (
  exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_transaction.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);

grant update (ledger_id) on ymoney.tb_mon_transaction to authenticated;
