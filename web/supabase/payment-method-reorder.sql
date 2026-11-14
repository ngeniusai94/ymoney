begin;

-- 기존 가계부 멤버 RLS를 적용하고 순서 컬럼만 수정할 수 있게 합니다.
grant update (sort_order) on ymoney.tb_mon_payment_method to authenticated;

create function ymoney.fn_mon_reorder_payment_methods(
  p_ledger_id bigint,
  p_method_type text,
  p_expected_ids bigint[],
  p_ordered_ids bigint[]
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  current_ids bigint[];
  updated_count integer;
begin
  if p_method_type is null or p_method_type not in ('CARD', 'CASH') then
    raise exception 'Invalid payment method type';
  end if;

  -- 같은 가계부·유형의 동시 정렬은 차례로 처리합니다.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    pg_catalog.concat_ws(':', 'ymoney.payment-method-order', p_ledger_id, p_method_type), 0
  ));

  select array_agg(m.payment_method_id order by m.sort_order, m.payment_method_id)
  into current_ids
  from ymoney.tb_mon_payment_method m
  where m.ledger_id = p_ledger_id and m.method_type = p_method_type;

  -- 현재 목록과 순서가 일치하고, 새 목록이 같은 항목의 순열인지 확인합니다.
  if current_ids is null or current_ids is distinct from p_expected_ids
    or (select array_agg(id order by id) from unnest(p_ordered_ids) as ids(id))
       is distinct from (select array_agg(id order by id) from unnest(current_ids) as ids(id))
  then
    raise exception 'Payment method order changed or scope does not match';
  end if;

  -- 기존 순서 값이 중복되어도 요청한 순서를 정확히 저장합니다.
  update ymoney.tb_mon_payment_method m
  set sort_order = (new_order.position - 1)::integer
  from unnest(p_ordered_ids) with ordinality as new_order(id, position)
  where m.payment_method_id = new_order.id and m.ledger_id = p_ledger_id
    and m.method_type = p_method_type;

  get diagnostics updated_count = row_count;
  if updated_count <> cardinality(current_ids) then
    raise exception 'Payment method scope or permissions changed';
  end if;
end;
$$;

revoke execute on function ymoney.fn_mon_reorder_payment_methods(bigint, text, bigint[], bigint[]) from public, anon;
grant execute on function ymoney.fn_mon_reorder_payment_methods(bigint, text, bigint[], bigint[]) to authenticated;

commit;
