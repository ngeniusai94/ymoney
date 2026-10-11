import { get_supabase_client } from '../../lib/supabase'
import type { CategoryGroup, ManagedCategory } from './categories.utils'

/** 삭제하지 않고 활성 상태만 변경합니다. 상위와 하위는 한 UPDATE로 함께 처리합니다. */
export async function deactivate_category(ledger_id: string, category: ManagedCategory): Promise<void> {
  let request = get_supabase_client().schema('ymoney').from('tb_mon_category')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('ledger_id', ledger_id)
    .eq('trans_type', 'EXPENSE')
    .eq('is_active', true)
  if (category.parent_category_id === null) {
    // 관리 목록에서 받은 숫자 ID만 필터 문법에 넣습니다.
    if (!/^\d+$/.test(category.category_id)) throw new Error('카테고리 정보를 확인해주세요.')
    request = request.or(`category_id.eq.${category.category_id},parent_category_id.eq.${category.category_id}`)
  } else {
    request = request.eq('category_id', category.category_id)
  }
  const { data, error } = await request.select('category_id')
  if (error) throw new Error('카테고리를 비활성화하지 못했습니다. 다시 시도해주세요.')
  if (!data?.some((row) => String(row.category_id) === category.category_id)) {
    throw new Error('비활성화할 카테고리가 없습니다. 목록을 새로고침해주세요.')
  }
}

/** ID와 부모 관계는 유지하고 사용자가 수정할 수 있는 표시 정보만 갱신합니다. */
export async function update_category(input: {
  ledger_id: string
  category: ManagedCategory
  category_name: string
  icon_key: string | null
  category_group_id: string | null
  is_active?: true
}): Promise<void> {
  const supabase = get_supabase_client().schema('ymoney')
  // 하위 복구는 부모가 활성인 경우만 허용합니다. 별도 DB 함수는 만들지 않습니다.
  if (input.is_active === true && input.category.parent_category_id !== null) {
    const { data: parent, error } = await supabase.from('tb_mon_category').select('category_id')
      .eq('ledger_id', input.ledger_id).eq('category_id', input.category.parent_category_id)
      .eq('trans_type', 'EXPENSE').eq('is_active', true).is('parent_category_id', null).maybeSingle()
    if (error) throw new Error('상위 카테고리를 확인하지 못했습니다.')
    if (!parent) throw new Error('상위 카테고리를 먼저 활성화해주세요.')
  }
  const changes: { category_name: string; updated_at: string; icon_key?: string | null; category_group_id?: string | null; is_active?: true } = {
    category_name: input.category_name,
    updated_at: new Date().toISOString(),
  }
  if (input.is_active === true) changes.is_active = true
  // 하위는 이름만 수정하며 상위에만 아이콘과 그룹 변경을 허용합니다.
  if (input.category.parent_category_id === null) {
    changes.icon_key = input.icon_key
    changes.category_group_id = input.category_group_id
  }
  const { data, error } = await supabase.from('tb_mon_category')
    .update(changes)
    .eq('ledger_id', input.ledger_id)
    .eq('category_id', input.category.category_id)
    .eq('trans_type', 'EXPENSE')
    .eq('is_active', input.category.is_active)
    .select('category_id')
    .maybeSingle()
  if (error) throw new Error('카테고리를 수정하지 못했습니다. 다시 시도해주세요.')
  // RLS로 숨겨졌거나 비활성화된 행의 0건 수정도 성공으로 안내하지 않습니다.
  if (!data) throw new Error('수정할 카테고리가 없습니다. 목록을 새로고침해주세요.')
}

type GroupRow = Omit<CategoryGroup, 'category_group_id'> & { category_group_id: number | string }

/** 그룹만 정리합니다. 카테고리 ID/활성 상태와 기존 지출 연결은 유지합니다. */
export async function deactivate_category_group(ledger_id: string, group_id: string): Promise<void> {
  const supabase = get_supabase_client().schema('ymoney')
  const updated_at = new Date().toISOString()
  // 비활성 카테고리도 함께 연결 해제하여 나중에 복구해도 그룹 없이 표시합니다.
  const { error: category_error } = await supabase.from('tb_mon_category')
    .update({ category_group_id: null, updated_at })
    .eq('ledger_id', ledger_id).eq('trans_type', 'EXPENSE').eq('category_group_id', group_id)
  if (category_error) throw new Error('소속 카테고리를 옮기지 못했습니다. 그룹은 비활성화하지 않았습니다.')

  // 두 요청은 트랜잭션이 아닙니다. 두 번째 실패 시 이동 결과를 유지하고 재시도를 안내합니다.
  const { data, error } = await supabase.from('tb_mon_category_group')
    .update({ is_active: false, updated_at })
    .eq('ledger_id', ledger_id).eq('trans_type', 'EXPENSE').eq('category_group_id', group_id)
    .eq('is_active', true).select('category_group_id').maybeSingle()
  if (error) throw new Error('카테고리는 그룹 없이 옮겼지만 그룹을 비활성화하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('그룹 상태가 변경되었습니다. 목록을 새로고침해주세요.')
  // RPC로 일관성 강화 필요 항목: 공유 멤버의 동시 그룹 배정은 MVP 최종 점검에서 검토합니다.
}

/** 그룹명과 선택적인 복구 상태만 변경하며 카테고리 배정은 유지합니다. */
export async function update_category_group(input: {
  ledger_id: string
  category_group_id: string
  group_name: string
  current_is_active: boolean
  is_active?: true
}): Promise<void> {
  const changes: { group_name: string; updated_at: string; is_active?: true } = {
    group_name: input.group_name, updated_at: new Date().toISOString(),
  }
  if (input.is_active === true) changes.is_active = true
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_category_group')
    .update(changes)
    .eq('ledger_id', input.ledger_id)
    .eq('category_group_id', input.category_group_id)
    .eq('trans_type', 'EXPENSE')
    .eq('is_active', input.current_is_active)
    .select('category_group_id')
    .maybeSingle()
  if (error) throw new Error('그룹 이름을 수정하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('수정할 그룹이 없습니다. 목록을 새로고침해주세요.')
}
type CategoryRow = Omit<ManagedCategory, 'category_id' | 'category_group_id' | 'parent_category_id'> & {
  category_id: number | string
  category_group_id: number | string | null
  parent_category_id: number | string | null
}

/** 선택한 가계부의 그룹·상위·하위 카테고리를 관리 화면용으로 읽습니다. */
export async function get_category_management_data(ledger_id: string): Promise<{
  groups: CategoryGroup[]
  categories: ManagedCategory[]
}> {
  const supabase = get_supabase_client().schema('ymoney')
  const [group_result, category_result] = await Promise.all([
    supabase.from('tb_mon_category_group')
      .select('category_group_id, group_name, sort_order, is_active')
      .eq('ledger_id', ledger_id).eq('trans_type', 'EXPENSE')
      .order('sort_order').order('category_group_id'),
    supabase.from('tb_mon_category')
      .select('category_id, category_group_id, parent_category_id, category_name, icon_key, sort_order, is_active')
      .eq('ledger_id', ledger_id).eq('trans_type', 'EXPENSE')
      .order('sort_order').order('category_id'),
  ])

  if (group_result.error || category_result.error) {
    throw new Error('카테고리를 불러오지 못했습니다.')
  }

  return {
    groups: ((group_result.data ?? []) as GroupRow[]).map((group) => ({
      ...group,
      category_group_id: String(group.category_group_id),
    })),
    categories: ((category_result.data ?? []) as CategoryRow[]).map((category) => ({
      ...category,
      category_id: String(category.category_id),
      category_group_id: category.category_group_id === null ? null : String(category.category_group_id),
      parent_category_id: category.parent_category_id === null ? null : String(category.parent_category_id),
    })),
  }
}

/** 선택한 가계부에 독립적인 상위 카테고리를 만듭니다. 그룹은 선택 사항입니다. */
export async function create_parent_category(input: {
  ledger_id: string
  category_name: string
  icon_key: string | null
  category_group_id: string | null
  sort_order: number
}): Promise<void> {
  const { error } = await get_supabase_client().schema('ymoney').from('tb_mon_category').insert({
    ledger_id: input.ledger_id,
    trans_type: 'EXPENSE',
    parent_category_id: null,
    category_name: input.category_name,
    icon_key: input.icon_key,
    category_group_id: input.category_group_id,
    sort_order: input.sort_order,
  })
  if (error) throw new Error('카테고리를 저장하지 못했습니다. 다시 시도해주세요.')
}

/** 선택한 가계부에 카테고리 그룹을 추가합니다. */
export async function create_category_group(input: {
  ledger_id: string
  group_name: string
  sort_order: number
}): Promise<void> {
  const { error } = await get_supabase_client().schema('ymoney').from('tb_mon_category_group').insert({
    ledger_id: input.ledger_id,
    trans_type: 'EXPENSE',
    group_name: input.group_name,
    sort_order: input.sort_order,
  })
  if (error) throw new Error('카테고리 그룹을 저장하지 못했습니다. 다시 시도해주세요.')
}

/** 하위는 부모 ID만 연결하고 그룹·아이콘은 저장하지 않습니다. */
export async function create_child_category(input: {
  ledger_id: string
  parent_category_id: string
  category_name: string
  sort_order: number
}): Promise<void> {
  const supabase = get_supabase_client().schema('ymoney')
  // 같은 가계부의 활성 상위인지 저장 직전에 확인합니다. 조회 요청은 INSERT와 분리합니다.
  const { data: parent, error: parent_error } = await supabase.from('tb_mon_category')
    .select('category_id')
    .eq('category_id', input.parent_category_id)
    .eq('ledger_id', input.ledger_id)
    .eq('trans_type', 'EXPENSE')
    .eq('is_active', true)
    .is('parent_category_id', null)
    .maybeSingle()
  if (parent_error) throw new Error('상위 카테고리를 확인하지 못했습니다. 다시 시도해주세요.')
  if (!parent) throw new Error('하위를 추가할 수 있는 상위 카테고리가 아닙니다. 목록을 새로고침해주세요.')

  // RPC로 보안성 강화 필요 항목: 직접 API 요청의 부모 관계와 확인/저장 사이 변경은 MVP 최종 점검에서 검토합니다.
  const { error } = await supabase.from('tb_mon_category').insert({
    ...input,
    trans_type: 'EXPENSE',
    category_group_id: null,
    icon_key: null,
  })
  if (error) throw new Error('하위 카테고리를 저장하지 못했습니다. 다시 시도해주세요.')
}
