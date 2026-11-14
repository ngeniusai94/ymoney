-- 같은 부모의 하위 또는 같은 그룹의 상위 카테고리 순서를 한 번에 저장합니다.
-- 호출자 권한으로 실행하며 기존 가계부 멤버 RLS를 적용합니다.
grant update (sort_order) on ymoney.tb_mon_category to authenticated;

create function ymoney.fn_mon_reorder_categories(
  p_ledger_id bigint,
  p_parent_id bigint,
  p_group_id bigint,
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
  -- 같은 범위의 동시 저장을 직렬화하고, 화면을 연 뒤 바뀐 목록은 덮어쓰지 않습니다.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    pg_catalog.concat_ws(':', 'ymoney.category-order', p_ledger_id,
      coalesce(p_parent_id::text, '-'), coalesce(p_group_id::text, '-')), 0
  ));

  select array_agg(c.category_id order by c.sort_order, c.category_id)
  into current_ids
  from ymoney.tb_mon_category c
  where c.ledger_id = p_ledger_id and c.trans_type = 'EXPENSE'
    and c.parent_category_id is not distinct from p_parent_id
    and c.category_group_id is not distinct from p_group_id;

  if current_ids is null or current_ids is distinct from p_expected_ids
    or cardinality(current_ids) is distinct from cardinality(p_ordered_ids)
    or (select array_agg(id order by id) from unnest(p_ordered_ids) as ids(id))
       is distinct from (select array_agg(id order by id) from unnest(current_ids) as ids(id))
  then
    raise exception 'Category order changed or scope does not match';
  end if;

  update ymoney.tb_mon_category c
  set sort_order = (new_order.position - 1)::integer
  from unnest(p_ordered_ids) with ordinality as new_order(id, position)
  where c.category_id = new_order.id and c.ledger_id = p_ledger_id
    and c.trans_type = 'EXPENSE'
    and c.parent_category_id is not distinct from p_parent_id
    and c.category_group_id is not distinct from p_group_id;

  get diagnostics updated_count = row_count;
  if updated_count <> cardinality(current_ids) then
    raise exception 'Category scope or permissions changed';
  end if;
end;
$$;

revoke execute on function ymoney.fn_mon_reorder_categories(bigint, bigint, bigint, bigint[], bigint[]) from public, anon;
grant execute on function ymoney.fn_mon_reorder_categories(bigint, bigint, bigint, bigint[], bigint[]) to authenticated;
