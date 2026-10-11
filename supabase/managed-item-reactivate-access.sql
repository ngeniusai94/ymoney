-- 기존 열 권한/멤버 제한은 그대로 유지하고 비활성 행의 수정·활성화를 허용합니다.
-- WITH CHECK는 변경하지 않습니다. 새 테이블·함수·트리거·열 권한 없음.
alter policy ymoney_update_member_categories on ymoney.tb_mon_category
using (
  trans_type = 'EXPENSE'
  and exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_category.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);

alter policy ymoney_update_member_payment_methods on ymoney.tb_mon_payment_method
using (
  exists (
    select 1 from ymoney.tb_mon_ledger_member lm
    where lm.ledger_id = tb_mon_payment_method.ledger_id
      and lm.user_srno = (
        select u.user_srno from public.tb_user u
        where u.user_uuid = (select auth.uid()) and u.use_yn = 'Y'
      )
  )
);
