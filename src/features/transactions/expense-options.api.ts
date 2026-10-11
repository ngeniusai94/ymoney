import { get_supabase_client } from '../../lib/supabase'

export type ExpenseCategory = {
  category_id: string
  parent_category_id: string | null
  category_name: string
  icon_key: string | null
  sort_order: number
}

export type ExpensePaymentMethod = {
  payment_method_id: string
  method_type: 'CARD' | 'CASH'
  method_name: string
  sort_order: number
}

type CategoryRow = Omit<ExpenseCategory, 'category_id' | 'parent_category_id'> & {
  category_id: number | string
  parent_category_id: number | string | null
  is_active: boolean
}
type PaymentRow = Omit<ExpensePaymentMethod, 'payment_method_id'> & {
  payment_method_id: number | string
  is_active: boolean
}
type GroupRow = { category_group_id: number | string; group_name: string }

/** 새 가계부에 지출 항목이 아직 없다면 PRD의 최소 기본값을 준비합니다. */
async function ensure_default_expense_options(ledger_id: string) {
  const supabase = get_supabase_client().schema('ymoney')
  const [category_result, payment_result] = await Promise.all([
    supabase.from('tb_mon_category').select('category_id').eq('ledger_id', ledger_id).limit(1),
    supabase.from('tb_mon_payment_method').select('payment_method_id').eq('ledger_id', ledger_id).limit(1),
  ])

  if (category_result.error || payment_result.error) {
    throw new Error('지출 항목을 확인하지 못했습니다.')
  }

  if (!category_result.data?.length) {
    const { data: existing_groups, error: group_error } = await supabase
      .from('tb_mon_category_group')
      .select('category_group_id, group_name')
      .eq('ledger_id', ledger_id)
      .eq('trans_type', 'EXPENSE')

    if (group_error) throw new Error('카테고리 그룹을 확인하지 못했습니다.')

    const group_names = ['생활비', '고정비', '특별비']
    const missing_groups = group_names.filter((name) =>
      !(existing_groups ?? []).some((group) => group.group_name === name),
    )
    let groups = (existing_groups ?? []) as GroupRow[]

    if (missing_groups.length) {
      const { data: inserted_groups, error: insert_group_error } = await supabase
        .from('tb_mon_category_group')
        .insert(missing_groups.map((name, index) => ({
          ledger_id, trans_type: 'EXPENSE', group_name: name, sort_order: index,
        })))
        .select('category_group_id, group_name')

      if (insert_group_error) throw new Error('기본 카테고리 그룹을 준비하지 못했습니다.')
      groups = [...groups, ...((inserted_groups ?? []) as GroupRow[])]
    }

    const group_id = (name: string) => groups.find((group) => group.group_name === name)?.category_group_id
    const default_categories = [
      { name: '식비', icon: '🍚', group: '생활비' },
      { name: '카페', icon: '☕', group: '생활비' },
      { name: '주거', icon: '🏠', group: '고정비' },
      { name: '취미', icon: '🎨', group: '특별비' },
    ]
    const { error: insert_category_error } = await supabase.from('tb_mon_category').insert(
      default_categories.map((category, index) => ({
        ledger_id,
        category_group_id: group_id(category.group),
        parent_category_id: null,
        trans_type: 'EXPENSE',
        category_name: category.name,
        icon_key: category.icon,
        sort_order: index,
      })),
    )
    if (insert_category_error) throw new Error('기본 카테고리를 준비하지 못했습니다.')
  }

  if (!payment_result.data?.length) {
    const { error } = await supabase.from('tb_mon_payment_method').insert({
      ledger_id, method_type: 'CASH', method_name: '현금', sort_order: 0,
    })
    if (error) throw new Error('기본 결제수단을 준비하지 못했습니다.')
  }
}

/** 선택 가계부의 활성 카테고리·결제수단을 가져옵니다. */
export async function get_expense_options(ledger_id: string): Promise<{
  categories: ExpenseCategory[]
  payment_methods: ExpensePaymentMethod[]
}> {
  await ensure_default_expense_options(ledger_id)
  const supabase = get_supabase_client().schema('ymoney')
  const [category_result, payment_result] = await Promise.all([
    supabase.from('tb_mon_category')
      .select('category_id, parent_category_id, category_name, icon_key, sort_order, is_active')
      .eq('ledger_id', ledger_id).eq('trans_type', 'EXPENSE').eq('is_active', true)
      .order('sort_order'),
    supabase.from('tb_mon_payment_method')
      .select('payment_method_id, method_type, method_name, sort_order, is_active')
      .eq('ledger_id', ledger_id).eq('is_active', true).order('sort_order'),
  ])

  if (category_result.error || payment_result.error) {
    throw new Error('카테고리 또는 결제수단을 불러오지 못했습니다.')
  }

  return {
    categories: ((category_result.data ?? []) as CategoryRow[]).map((row) => ({
      category_id: String(row.category_id),
      parent_category_id: row.parent_category_id === null ? null : String(row.parent_category_id),
      category_name: row.category_name,
      icon_key: row.icon_key,
      sort_order: row.sort_order,
    })),
    payment_methods: ((payment_result.data ?? []) as PaymentRow[]).map((row) => ({
      payment_method_id: String(row.payment_method_id),
      method_type: row.method_type,
      method_name: row.method_name,
      sort_order: row.sort_order,
    })),
  }
}
