-- 결제수단 이름/유형 변경과 비활성화에 필요한 열만 허용합니다.
-- 기존 SELECT/INSERT 및 멤버 제한은 유지합니다. 새 테이블·함수·트리거 없음.
grant update (method_name, method_type, is_active, updated_at)
on ymoney.tb_mon_payment_method to authenticated;

create policy ymoney_update_member_payment_methods
on ymoney.tb_mon_payment_method for update to authenticated
using (
  is_active = true
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_payment_method.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
)
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
