-- 사용자 직접 선택 로고만 저장합니다. 기존 행/멤버 RLS/공용 사용자 테이블은 변경하지 않습니다.
alter table ymoney.tb_mon_payment_method add column if not exists icon_key text;
comment on column ymoney.tb_mon_payment_method.icon_key is '사용자가 선택한 결제수단 로고 키. NULL은 유형별 기본 아이콘';
grant update (icon_key) on ymoney.tb_mon_payment_method to authenticated;
notify pgrst, 'reload schema';
